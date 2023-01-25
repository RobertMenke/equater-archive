import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, In, Repository } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { User } from '../user/user.entity'
import { DeviceRegistrationDto } from './device.dto'
import { PushNotification } from './push-notification.entity'
import { UserDevice } from './user-device.entity'

@Injectable()
export class DeviceService implements DeletesManagedResources {
    constructor(
        @InjectRepository(UserDevice)
        private readonly deviceRepository: Repository<UserDevice>,
        @InjectRepository(PushNotification)
        private readonly pushNotificationRepository: Repository<PushNotification>
    ) {}

    findWhere(conditions: FindOptionsWhere<UserDevice>): Promise<UserDevice[]> {
        return this.deviceRepository.find({
            where: conditions
        })
    }

    async registerDevice(dto: DeviceRegistrationDto, user: User) {
        const matchingRegistration = await this.deviceRepository.findOne({
            where: {
                userId: user.id,
                fcmToken: dto.fcmToken
            }
        })

        if (matchingRegistration) {
            return matchingRegistration
        }

        const entity = new UserDevice({
            userId: user.id,
            fcmToken: dto.fcmToken,
            deviceModel: dto.deviceModel,
            deviceOsName: dto.deviceOsName,
            deviceOsVersion: dto.deviceOsVersion
        })

        return await this.deviceRepository.save(entity)
    }

    async deleteManagedResourcesForUser(user: User): Promise<void> {
        const devices = await this.deviceRepository.findBy({
            userId: user.id
        })

        const deviceIds = devices.map((device) => device.id)

        await this.pushNotificationRepository.delete({
            deviceId: In(deviceIds)
        })

        await this.deviceRepository.delete({
            userId: user.id
        })
    }
}
