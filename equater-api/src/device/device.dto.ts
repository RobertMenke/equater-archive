import { IsString } from 'class-validator'

export class DeviceRegistrationDto {
    @IsString()
    fcmToken: string

    @IsString()
    deviceModel: string

    @IsString()
    deviceOsVersion: string

    @IsString()
    deviceOsName: string
}
