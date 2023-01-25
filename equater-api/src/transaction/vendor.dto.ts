import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { UniqueVendorAssociationType } from './unique-vendor-association.entity'

export class PatchVendorDto {
    @IsString()
    friendlyName: string

    @IsBoolean()
    preProcessedLogoWasUploaded: boolean

    @IsString()
    @IsOptional()
    ppdId: string

    @IsBoolean()
    vendorIdentityCannotBeDetermined: boolean
}

export class AssociateVendorDto {
    @IsString()
    associationType: UniqueVendorAssociationType

    @IsString()
    notes: string
}

export class CreateVendorDto {
    @IsString()
    friendlyName: string

    // Don't love the front-end dictating a UUID to the back-end,
    // but in order to pull a logo ahead of time and keep it associated with
    // a uuid it makes sense in this case and I don't think it's problematic.
    @IsString()
    uuid: string
}

// Used to create a vendor from a google places response
export class CreateVendorFromPlaceDto {
    @IsString()
    placeId: string

    @IsString()
    fullText: string

    @IsString()
    primaryText: string

    @IsString()
    secondaryText: string
}
