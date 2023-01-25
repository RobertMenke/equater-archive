import {
    Body,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Logger,
    Param,
    ParseIntPipe,
    Patch,
    Put,
    Query,
    Request,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { AccountDeletionEvent } from '../account_deletion/account-deletion.event'
import { DeviceRegistrationDto } from '../device/device.dto'
import { DeviceService } from '../device/device.service'
import { VerificationCompleteEvent } from '../expense_api/verification-complete.handler'
import { AdminOrSelfGuard } from '../guards/auth/admin-or-self.guard'
import { AuthenticatedRequest, AuthenticationGuard } from '../guards/auth/authentication.guard'
import { UserSearchCacheInterceptor } from '../interceptors/user-search-cache.interceptor'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { logError, mapAsync } from '../utils/data.utils'
import { DwollaIntegrationService } from './dwolla-integration.service'
import { RelationshipService } from './relationship.service'
import {
    DisclosureOfFeesDto,
    OnBoardingFeedback,
    PatchAddressDto,
    PatchLegalDocsDto,
    ProfilePhotoStatusDto,
    ProfilePhotoType,
    RecipientOfFundsFormDto,
    UserProfileDto
} from './user.dtos'
import { User } from './user.entity'
import { UserSearchResult, UserService } from './user.service'

@Controller('api/user')
@UseGuards(AuthenticationGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
    private readonly logger = new Logger(UserController.name)

    constructor(
        private readonly userService: UserService,
        private readonly dwollaService: DwollaIntegrationService,
        private readonly deviceService: DeviceService,
        private readonly relationshipService: RelationshipService,
        private readonly eventBus: EventBus,
        private readonly plaidLinkTokenService: PlaidLinkTokenService
    ) {}

    @Get()
    async findFromAuthToken(@Request() request: AuthenticatedRequest) {
        const user: User = request.user

        if (!user) {
            throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
        }

        await this.plaidLinkTokenService.updatePlaidLinkTokenIfNecessary(user)

        return await this.userService.serializeUser(user)
    }

    // Note: this route makes use of imperative styles where possible to optimize for speed.
    @Get('search')
    @UseInterceptors(UserSearchCacheInterceptor)
    @CacheTTL(60)
    async search(
        @Request() request: AuthenticatedRequest,
        @Query('searchTerm') searchTerm: string,
        @Query('includeAuthenticatedUser') includeAuthenticatedUser: string
    ): Promise<UserSearchResult> {
        const user: User = request.user

        if (searchTerm.trim().length === 0) {
            return {
                friends: [],
                users: []
            }
        }

        // Kick off searches for relationships and users in parallel
        const usersPromise = this.userService.searchBy(user, searchTerm, includeAuthenticatedUser === 'true')
        const relationshipsPromise = this.relationshipService.findRelationships(user)

        try {
            return await this.relationshipService.categorizeSearchResultsByRelationshipStatus(
                user,
                await relationshipsPromise,
                await usersPromise
            )
        } catch (e) {
            logError(this.logger, e)
            throw new HttpException(`Error searching for users`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Patch('name')
    async patchName(@Request() request: AuthenticatedRequest, @Body() dto: UserProfileDto) {
        const user: User = request.user
        const patchedUser = await this.userService.patchProfile(user, dto)

        return await this.userService.serializeUser(patchedUser)
    }

    @Patch('legal-doc-acceptance')
    async patchLegalDocAcceptance(@Request() request: AuthenticatedRequest, @Body() dto: PatchLegalDocsDto) {
        const user: User = request.user

        user.acceptedTermsOfService = dto.acceptedTermsOfService
        user.acceptedPrivacyPolicy = dto.acceptedPrivacyPolicy

        const updatedUser = await this.userService.save(user)

        return await this.userService.serializeUser(updatedUser)
    }

    /**
     * This updates a user on Dwolla's side, not a specific account, which is why
     * this exists in the user controller and not the user account controller
     *
     * @param request
     * @param dto
     */
    @Patch('recipient-of-funds')
    async setRecipientOfFundsProfileDetails(
        @Request() request: AuthenticatedRequest,
        @Body() dto: RecipientOfFundsFormDto
    ) {
        const user: User = request.user

        // If the user can already receive funds we can't update their SSN or date of birth
        // The address can be updated, but that should be handled separately if necessary
        // See: https://docs.dwolla.com/#update-a-customer
        if (user.canReceiveFunds) {
            throw new HttpException(`Cannot update a verified customer`, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const patchedUser = await this.userService.patchRecipientOfFundsFields(user, dto)
        const upgradedUser = await this.dwollaService.createOrUpdateCustomer(patchedUser)
        this.eventBus.publish(new VerificationCompleteEvent(upgradedUser.id))

        return await this.userService.serializeUser(upgradedUser)
    }

    @Patch('address')
    async setAddress(@Request() request: AuthenticatedRequest, @Body() dto: PatchAddressDto) {
        const user: User = request.user

        const patchedUser = await this.userService.patchAddress(user, dto)
        const updatedUser = await this.dwollaService.createOrUpdateCustomer(patchedUser)

        return await this.userService.serializeUser(updatedUser)
    }

    @Patch('disclosure-of-fees')
    async setDisclosureOfFeesResponse(@Request() request: AuthenticatedRequest, @Body() dto: DisclosureOfFeesDto) {
        const user: User = request.user
        user.disclosureOfFeesResponse = dto.response
        const updatedUser = await this.userService.save(user)

        return await this.userService.serializeUser(updatedUser)
    }

    @Get('pre-signed-photo-upload-url')
    async getPreSignedPhotoUploadUrl(
        @Request() request: AuthenticatedRequest,
        @Query('photoType') type: ProfilePhotoType
    ) {
        const user: User = request.user
        type = type || ProfilePhotoType.AVATAR

        // The encrypted UUID here is used so that when client sends us a patch request to
        // photo-upload-status we can verify that the UUID supplied is the one that we sent
        return {
            preSignedUrl: await this.userService.createPreSignedPhotoUploadUrl(user, type)
        }
    }

    @Get('pre-signed-photo-download-url')
    async getPreSignedPhotoDownloadUrl(
        @Request() request: AuthenticatedRequest,
        @Query('photoType') type: ProfilePhotoType,
        // Users can view the profile photos of other users
        @Query('userId') userId: number
    ) {
        const user: User = request.user
        const requestingUser = userId ? await this.userService.findOneWhere({ id: userId }) : user
        type = type || ProfilePhotoType.AVATAR

        if (type === ProfilePhotoType.AVATAR && !requestingUser.profilePhotoUploadCompleted) {
            return {
                preSignedUrl: null
            }
        }

        if (type === ProfilePhotoType.COVER_PHOTO && !requestingUser.coverPhotoUploadCompleted) {
            return {
                preSignedUrl: null
            }
        }

        return {
            preSignedUrl: await this.userService.createPreSignedPhotoDownloadUrl(requestingUser, type)
        }
    }

    @Patch('photo-upload-status')
    async setPhotoUploadComplete(@Request() request: AuthenticatedRequest, @Body() dto: ProfilePhotoStatusDto) {
        const updatedUser = await this.userService.setPhotoUploadStatus(request.user, dto)

        return await this.userService.serializeUser(updatedUser)
    }

    @Put('register-device')
    @HttpCode(HttpStatus.CREATED)
    async registerDevice(@Body() dto: DeviceRegistrationDto, @Request() request: AuthenticatedRequest) {
        try {
            const user: User = request.user
            await this.deviceService.registerDevice(dto, user)
        } catch (e) {
            this.logger.debug(`Error registering device (likely duplicate token) ${e.message}`)
        }
    }

    @Patch('on-boarding-feedback')
    async setOnBoardingFeedback(@Request() request: AuthenticatedRequest, @Body() dto: OnBoardingFeedback) {
        const user: User = request.user
        const updatedUser = await this.userService.setOnBoardingFeedback(user, dto)

        return await this.userService.serializeUser(updatedUser)
    }

    @Get('balance')
    async getDwollaBalance(@Request() request: AuthenticatedRequest) {
        try {
            return await this.dwollaService.getCustomerBalance(request.user)
        } catch (e) {
            logError(this.logger, e)

            throw new HttpException(
                `Failed to retrieve a Dwolla balance for user ${request.user.id}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @Get(':id/relationships')
    @UseGuards(new AdminOrSelfGuard('id'))
    async getRelationships(@Request() request: AuthenticatedRequest, @Param('id', new ParseIntPipe()) id: number) {
        const user = await this.userService.findOneWhere({ id })

        if (!user) {
            throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
        }

        const relationships = await this.relationshipService.findRelationships(user)

        if (relationships.length === 0) {
            return []
        }

        const users = await this.userService.findUsersFromRelationships(user, relationships)

        return await mapAsync(users, (user) => this.userService.serializeUser(user))
    }

    @Get(':id')
    @UseGuards(new AdminOrSelfGuard('id'))
    async getUser(@Request() request: AuthenticatedRequest, @Param('id', new ParseIntPipe()) id: number) {
        const user = await this.userService.findOneWhere({ id })

        if (!user) {
            throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
        }

        return await this.userService.serializeUser(user)
    }

    /**
     * See the documentation for this function in `AccountDeletionHandler.handle`
     *
     * @see AccountDeletionHandler.handle
     * @see https://developer.apple.com/news/?id=12m75xbj
     * @param request
     * @param id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.ACCEPTED)
    async permanentlyDeleteUser(@Request() request: AuthenticatedRequest, @Param('id', new ParseIntPipe()) id: number) {
        if (id !== request.user.id) {
            throw new HttpException(`Cannot delete an account that does not belong to you`, HttpStatus.FORBIDDEN)
        }

        this.eventBus.publish(new AccountDeletionEvent(request.user))
    }
}
