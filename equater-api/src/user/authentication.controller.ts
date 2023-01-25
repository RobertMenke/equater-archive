import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Inject,
    Logger,
    Param,
    Post,
    Put,
    Request,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { instanceToPlain } from 'class-transformer'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { AuthService } from './auth.service'
import { LoginLogService } from '../login_log/login-log.service'
import { EmailConfirmationEvent } from '../socket/events/email-confirmation.event'
import { UserAccountService } from '../user_account/user-account.service'
import { log, logError, mapAsync } from '../utils/data.utils'
import { UserInviteService } from './user-invite.service'
import { EmailDto, PasswordResetDto, SignInCredentialsDto, UserCredentialsDto, VerificationCodeDto } from './user.dtos'
import { Role } from './user.entity'
import { UserService } from './user.service'
import { Request as ExpressRequest } from 'express'

@Controller('api/auth')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticationController {
    private readonly logger = new Logger(AuthenticationController.name)

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly loginLogService: LoginLogService,
        private readonly userAccountService: UserAccountService,
        private readonly userInviteService: UserInviteService,
        private readonly eventBus: EventBus,
        private readonly plaidLinkTokenService: PlaidLinkTokenService
    ) {}

    /**
     * Current password policy is 8 or more chars
     *
     * @param request
     * @param dto
     */
    @Put('register')
    @HttpCode(201)
    async register(@Request() request: ExpressRequest, @Body() dto: UserCredentialsDto) {
        //Verify that the user doesn't already exist
        const user = await this.userService.findOneWhere({
            email: dto.email.toLowerCase().trim()
        })

        if (user) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST)
        }

        //Register the user and then send email confirmation
        const unconfirmedUser = await this.userService.register(dto)
        await this.plaidLinkTokenService.updatePlaidLinkTokenIfNecessary(unconfirmedUser)
        this.userService.sendConfirmEmailMessage(unconfirmedUser).catch(log)

        //Add a log of their login
        await this.loginLogService.log(request, unconfirmedUser)

        //Ensure that any unconverted [UserInvite]s get marked as converted
        const invites = await this.userInviteService.getInviteByEmail(unconfirmedUser.email)
        const userAgreementStories = await this.userInviteService.handleConversionToUser(unconfirmedUser, invites)
        const authToken = this.authService.createBearerToken(unconfirmedUser)
        // No need to wait for this task to complete
        this.userService.updateSessionToken(unconfirmedUser, authToken).catch((e) => logError(this.logger, e))

        return {
            authToken: authToken,
            user: await this.userService.serializeUser(unconfirmedUser),
            userAccounts: [],
            // TODO: After coming back to this I don't think this route should return userAgreementStories.
            // TODO: Instead, the app should fetch these so that it's the same flow for login/registration
            userAgreementStories: await mapAsync(userAgreementStories, async (story) => ({
                initiatingUser: await this.userService.serializeUser(story.initiatingUser),
                sharedExpense: instanceToPlain(story.sharedExpense, { excludePrefixes: ['__'] }),
                userAgreement: instanceToPlain(story.userAgreement, { excludePrefixes: ['__'] })
            }))
        }
    }

    @Post('login')
    @HttpCode(201)
    async login(@Request() request: ExpressRequest, @Body() dto: SignInCredentialsDto) {
        const user = await this.userService.findByCredentials(dto)
        await this.loginLogService.log(request, user)

        let token = user.sessionToken
        if (!token) {
            token = this.authService.createBearerToken(user)
            this.userService.updateSessionToken(user, token).catch((e) => logError(this.logger, e))
        }

        const activeAccounts = await this.userAccountService.getAccountsForUser(user)
        await this.plaidLinkTokenService.updatePlaidLinkTokenIfNecessary(user)

        return {
            authToken: token,
            userAccounts: activeAccounts.map((account) => instanceToPlain(account, { excludePrefixes: ['__'] })),
            user: await this.userService.serializeUser(user)
        }
    }

    @Post('admin-login')
    @HttpCode(201)
    async adminLogin(@Request() request: ExpressRequest, @Body() dto: SignInCredentialsDto) {
        const user = await this.userService.findByCredentials(dto)

        if (user.role !== Role.ADMIN) {
            throw new HttpException('Access Denied', HttpStatus.FORBIDDEN)
        }

        await this.loginLogService.log(request, user)
        const token = await this.authService.createAdminBearerToken(user)
        const activeAccounts = await this.userAccountService.getAccountsForUser(user)

        return {
            authToken: token,
            userAccounts: activeAccounts.map((account) => instanceToPlain(account, { excludePrefixes: ['__'] })),
            user: await this.userService.serializeUser(user)
        }
    }

    @Get('verify-email/:uuid')
    @HttpCode(200)
    async verifyEmail(@Param() dto: VerificationCodeDto) {
        const user = await this.userService.findOneWhere({
            emailVerificationCode: dto.uuid
        })

        if (!user) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND)
        }

        if (!this.userService.emailVerificationTokenIsValid(user)) {
            throw new HttpException('Expired verification token', HttpStatus.UNAUTHORIZED)
        }

        const updatedUser = await this.userService.setEmailIsConfirmed(user)
        const event = new EmailConfirmationEvent(updatedUser)
        this.eventBus.publish(event)

        return updatedUser
    }

    @Post('resend-email-verification')
    @HttpCode(201)
    async resendEmailVerification(@Body() dto: EmailDto) {
        let user = await this.userService.findOneWhere({ email: dto.email })
        //Don't respond with 404 so that malicious users cannot userProfile resending verification to
        //to figure out who is a user
        if (!user) {
            return
        }

        user = await this.userService.updateEmailConfirmation(user)
        await this.userService.sendConfirmEmailMessage(user)
    }

    @Post('request-password-reset')
    @HttpCode(201)
    async requestPasswordReset(@Body() dto: EmailDto) {
        let user = await this.userService.findOneWhere({ email: dto.email })

        //Don't respond with 404 so that malicious users cannot userProfile pw reset requests to
        //to figure out who is a userProfile
        if (!user) {
            return
        }

        user = await this.userService.updatePasswordResetCode(user)
        await this.userService.sendPasswordResetEmail(user)
    }

    @Post('password-reset')
    @HttpCode(201)
    async performPasswordReset(@Body() dto: PasswordResetDto) {
        const user = await this.userService.findOneWhere({
            passwordResetCode: dto.uuid
        })

        if (!user) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND)
        }

        if (!this.userService.passwordResetTokenIsValid(user)) {
            throw new HttpException('Invalid or expired password reset token', HttpStatus.UNAUTHORIZED)
        }

        await this.userService.setPassword(user, dto.password)
        await this.userService.removePasswordResetCode(user)
    }
}
