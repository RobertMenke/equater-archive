import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'
import { MINIMUM_PASSWORD_LENGTH } from './authentication.constants'
import { DisclosureOfFeesResponse } from './user.entity'

export class UserCredentialsDto {
    @IsEmail({})
    @ApiProperty({ type: String, example: 'robert@gmail.com' })
    email: string

    @IsString()
    @Length(MINIMUM_PASSWORD_LENGTH)
    @ApiProperty({ type: String })
    password: string
}

export class SignInCredentialsDto {
    @IsEmail({})
    @ApiProperty({ type: String, example: 'robert@gmail.com' })
    email: string

    // TODO: 8 chars in the minimum password we'll ever support. Currently, Dwolla
    // TODO: is forcing us to have a 12 password character minimum until we have a
    // TODO: 2fa system
    @IsString()
    @Length(8)
    @ApiProperty({ type: String })
    password: string
}

export class EmailDto {
    @IsEmail()
    @ApiProperty({ type: String })
    email: string
}

export class UserIdDto {
    @IsNotEmpty()
    userId: number
}

export class SessionTokenDto {
    @IsNotEmpty()
    userId: number

    @IsNotEmpty()
    sessionId: string
}

export class UserAccountDto {
    @IsNotEmpty()
    userAccountId: number
}

export class VerificationCodeDto {
    @IsString()
    uuid: string
}

export class PasswordResetDto {
    //Encrypted uuid comprised of userId + uuid
    @IsString()
    uuid: string

    @IsString()
    @Length(MINIMUM_PASSWORD_LENGTH)
    password: string
}

export class LinkBankAccountDto {
    @IsString()
    @IsNotEmpty()
    token: string

    metaData: PlaidMetaDataDto
}

export class PlaidMetaDataDto {
    account: PlaidAccountDto
    institution: PlaidInstitutionDto
}

export class PlaidAccountDto {
    @IsString()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    subtype: string

    @IsString()
    @IsNotEmpty()
    type: string

    @IsString()
    @IsNotEmpty()
    mask: string
}

export class PlaidInstitutionDto {
    @IsString()
    @IsNotEmpty()
    institutionId: string

    @IsString()
    @IsNotEmpty()
    name: string
}

export class UserProfileDto {
    @IsString()
    @IsNotEmpty()
    firstName: string

    @IsString()
    @IsNotEmpty()
    lastName: string
}

export class PatchLegalDocsDto {
    @IsBoolean()
    acceptedTermsOfService: boolean

    @IsBoolean()
    acceptedPrivacyPolicy: boolean
}

export class PatchAddressDto {
    address: RecipientOfFundsAddress
}

export class DisclosureOfFeesDto {
    response: DisclosureOfFeesResponse
}

export class RecipientOfFundsFormDto {
    address: RecipientOfFundsAddress

    @IsString()
    dateOfBirth: string

    @IsString()
    @Length(4, 4)
    lastFourOfSsn: string
}

export class RecipientOfFundsAddress {
    @IsString()
    @IsNotEmpty()
    addressOne: string

    addressTwo: string | null

    @IsString()
    @IsNotEmpty()
    city: string

    @IsString()
    @Length(2, 3)
    state: string

    @IsString()
    @Length(5)
    postalCode: string
}

export class ProfilePhotoStatusDto {
    @IsBoolean()
    profilePhotoUploadComplete: boolean

    @IsString()
    @IsOptional()
    mimeType?: string

    photoType: ProfilePhotoType
}
export enum ProfilePhotoType {
    COVER_PHOTO = 'COVER_PHOTO',
    AVATAR = 'AVATAR'
}
export enum OnBoardingSelection {
    SPLIT_BILLS = 'splitBills',
    SPLIT_SUBSCRIPTIONS = 'splitSubscriptions',
    CHARGING_TENANTS = 'chargingTenants',
    SOMETHING_ELSE = 'somethingElse'
}

export class OnBoardingFeedback {
    @IsString()
    selection: OnBoardingSelection

    @IsString()
    @IsOptional()
    additionalFeedback: string | null
}
