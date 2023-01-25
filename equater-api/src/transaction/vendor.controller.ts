import {
    Body,
    CacheTTL,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Put,
    Query,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { instanceToPlain } from 'class-transformer'
import { ConfigService, Environment } from '../config/config.service'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { Roles, RolesGuard } from '../guards/auth/roles.guard'
import { VendorSearchCacheInterceptor } from '../interceptors/vendor-search-cache.interceptor'
import { ParseOptionalIntPipe } from '../pipes/ParseOptionalIntPipe'
import { Role } from '../user/user.entity'
import { mapAsync } from '../utils/data.utils'
import { VENDORS_PER_PAGE } from './vendor.constants'
import { AssociateVendorDto, CreateVendorDto, CreateVendorFromPlaceDto, PatchVendorDto } from './vendor.dto'
import { VendorService } from './vendor.service'

// TODO: Add role-based guard for internal-only functionality
@Controller('api/vendor')
@UseGuards(AuthenticationGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class VendorController {
    private readonly logger = new Logger(VendorController.name)

    constructor(private readonly configService: ConfigService, private readonly vendorService: VendorService) {}

    @Get()
    async getVendors(@Query('page', ParseOptionalIntPipe) page: number = 0) {
        const offset = VENDORS_PER_PAGE * page
        const [vendors, totalVendors] = await this.vendorService.listVendors(offset)
        const hasNextPage = offset + VENDORS_PER_PAGE < totalVendors
        const hasPreviousPage = page > 0

        return {
            vendors: await mapAsync(vendors, (vendor) => this.vendorService.serializeVendor(vendor)),
            nextPage: hasNextPage
                ? `${this.configService.get(Environment.API_BASE)}/api/vendor?page=${page + 1}`
                : null,
            previousPage: hasPreviousPage
                ? `${this.configService.get(Environment.API_BASE)}/api/vendor?page=${page - 1}`
                : null
        }
    }

    @Put()
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async createNewVendor(@Body() dto: CreateVendorDto) {
        const existingVendor = await this.vendorService.findUniqueVendorBy({ friendlyName: dto.friendlyName })

        if (existingVendor) {
            throw new HttpException(`Vendor already exists at PUT /api/vendor`, HttpStatus.CONFLICT)
        }

        return await this.vendorService.createUniqueVendorFromOps(dto)
    }

    @Put('from-google-places')
    async createVendorFromGooglePlacesResponse(@Body() dto: CreateVendorFromPlaceDto) {
        const existingVendor = await this.vendorService.findUniqueVendorBy({ friendlyName: dto.primaryText })

        if (existingVendor) {
            return await this.vendorService.serializeVendor(existingVendor)
        }

        const vendor = await this.vendorService.createUniqueVendorFromGooglePlaces(dto)

        return await this.vendorService.serializeVendor(vendor)
    }

    @Get('popular')
    async getPopularVendors(@Query('limit', ParseOptionalIntPipe) limit: number) {
        const selectionLimit = limit ? Math.min(limit, 100) : 50
        const vendors = await this.vendorService.listPopularVendors(selectionLimit)

        return {
            vendors: await mapAsync(vendors, (vendor) => this.vendorService.serializeVendor(vendor))
        }
    }

    @Get('requires-internal-review')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getVendorsThatRequireInternalReview() {
        const vendors = await this.vendorService.findUniqueVendorsBy(
            { hasBeenReviewedInternally: false },
            {
                order: {
                    dateTimeAdded: 'DESC'
                }
            }
        )

        return {
            vendors: await mapAsync(vendors, (vendor) => this.vendorService.serializeVendor(vendor))
        }
    }

    @Get('search')
    @UseInterceptors(VendorSearchCacheInterceptor)
    @CacheTTL(60)
    async search(
        @Query('searchTerm') searchTerm: string,
        @Query('requiringInternalReview') requiringInternalReview: string
    ) {
        if (typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
            return {
                vendors: []
            }
        }

        const result = await this.vendorService.searchVendors(searchTerm, requiringInternalReview !== 'true')

        return {
            vendors: await mapAsync(result, (vendor) => this.vendorService.serializeVendor(vendor))
        }
    }

    @Get('logo-lookup')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getLogo(@Query('vendorName') vendorName: string) {
        if (vendorName.trim().length === 0) {
            throw new HttpException('Please supply a vendor name', HttpStatus.BAD_REQUEST)
        }

        const existingVendor = await this.vendorService.findUniqueVendorBy({ friendlyName: vendorName })

        if (existingVendor) {
            throw new HttpException(`Vendor already exists`, HttpStatus.CONFLICT)
        }

        try {
            return await this.vendorService.attemptAutomaticLogoUploadFromUnknownVendor(vendorName)
        } catch (e) {
            this.logger.error(`${e.message} -- ${e.stack}`)

            throw new HttpException(`Logo not found for ${vendorName} in /api/vendor/logo-lookup`, HttpStatus.NOT_FOUND)
        }
    }

    @Get(':id')
    async getVendor(@Param('id') id: number) {
        const vendor = await this.vendorService.findUniqueVendorBy({ id })

        if (!vendor) {
            throw new NotFoundException()
        }

        return {
            vendor: await this.vendorService.serializeVendor(vendor)
        }
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async patchVendor(@Param('id', ParseIntPipe) id: number, @Body() dto: PatchVendorDto) {
        const vendor = await this.vendorService.findUniqueVendorBy({ id })

        if (!vendor) {
            throw new NotFoundException()
        }

        const patchedVendor = await this.vendorService.patchUniqueVendor(vendor, dto)

        return {
            vendor: await this.vendorService.serializeVendor(patchedVendor)
        }
    }

    @Get(':id/associations')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getVendorAssociations(@Param('id', ParseIntPipe) id: number) {
        const vendor = await this.vendorService.findUniqueVendorBy({ id })

        if (!vendor) {
            throw new NotFoundException()
        }

        const associations = await this.vendorService.findAllAssociations(vendor.id)

        return await this.vendorService.serializeUniqueVendorAssociations(associations)
    }

    @Delete(':id/associations/:associationId')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async deleteVendorAssociation(
        @Param('id', ParseIntPipe) id: number,
        @Param('associationId', ParseIntPipe) associationId: number
    ) {
        const vendor = await this.vendorService.findUniqueVendorBy({ id })

        if (!vendor) {
            throw new NotFoundException()
        }

        await this.vendorService.removeAssociation(associationId)
    }

    // This is a bit confusing, but this case here takes a vendor we've yet to review
    // and assigns any other transactions that come in with this particular name
    // to an existing vendor. It replaces this prospective "Unique Vendor" with
    // and existing vendor. Example: Spotify is an existing vendor and a charge
    // comes in with the name Spotify02082021.
    @Patch(':id/assign-to-existing-vendor/:existingUniqueVendorId')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async assignToExistingVendor(
        @Param('id') vendorUnderReviewId: number,
        @Param('existingUniqueVendorId') existingUniqueVendorId: number
    ) {
        const vendorUnderReview = await this.vendorService.findUniqueVendorBy({ id: vendorUnderReviewId })

        if (!vendorUnderReview) {
            throw new NotFoundException()
        }

        const existingVendor = await this.vendorService.findUniqueVendorBy({ id: existingUniqueVendorId })

        if (!existingVendor) {
            throw new NotFoundException()
        }

        const vendor = await this.vendorService.assignToExistingVendor(vendorUnderReview, existingVendor)

        return {
            vendor: await this.vendorService.serializeVendor(vendor)
        }
    }

    // In this case, we're taking a scenario where 2 vendors can be used interchangeably,
    // like the case where "TRG Management Group" is the parent company of "Icon Central".
    // Any charge issued by "TRG Management Group" should be picked up by the "Icon Central"
    // shared bill.
    @Put(':vendorId/associate-with/:associatedVendorId')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async associateTwoVendors(
        @Param('vendorId') vendorId: number,
        @Param('associatedVendorId') associatedVendorId: number,
        @Body() dto: AssociateVendorDto
    ) {
        const association = await this.vendorService.makeUniqueVendorAssociation(vendorId, associatedVendorId, dto)

        return {
            association: instanceToPlain(association, { excludePrefixes: ['__'] }),
            vendor: instanceToPlain(await association.uniqueVendor, { excludePrefixes: ['__'] }),
            associatedVendor: instanceToPlain(await association.associatedUniqueVendor, { excludePrefixes: ['__'] })
        }
    }

    @Get(':id/logo-upload-url')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getLogoUploadUrl(@Param('id') id: number) {
        const vendor = await this.vendorService.findUniqueVendorBy({ id })

        if (!vendor) {
            throw new NotFoundException()
        }

        return {
            preSignedUploadUrl: await this.vendorService.createPreSignedUploadUrlForVendorLogo(vendor)
        }
    }
}
