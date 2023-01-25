import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as admin from 'firebase-admin'
import { FindOptionsWhere, Repository } from 'typeorm'
import { Provider } from '../config/config.service'
import { mapAsync, removeDuplicates } from '../utils/data.utils'
import { PushNotification, PushNotificationStatus } from './push-notification.entity'
import { PushNotificationTag } from './push-notification.service'
import { UserDevice } from './user-device.entity'
import { faker } from '@faker-js/faker'

// This fake just inserts database records for push notifications without
// making real calls to firebase. Look into simply mocking firebase in the future.
// this is quick & dirty.
@Injectable()
export class PushNotificationServiceFake {
    private readonly logger = new Logger(PushNotificationServiceFake.name)

    constructor(
        @Inject(Provider.FIREBASE_ADMIN)
        private readonly client: admin.app.App,
        @InjectRepository(PushNotification)
        private readonly repository: Repository<PushNotification>
    ) {}

    findWhere(options: FindOptionsWhere<PushNotification>): Promise<PushNotification[]> {
        return this.repository.find({
            where: options
        })
    }

    async sendNotification<T extends { [key: string]: string }>(
        device: UserDevice,
        tag: PushNotificationTag,
        notification: admin.messaging.Notification,
        data: T = undefined
    ) {
        try {
            const entity = new PushNotification({
                deviceId: device.id,
                messageId: faker.random.alphaNumeric(10),
                title: notification.title,
                body: notification.body,
                status: PushNotificationStatus.SUCCESS
            })
            await this.repository.save(entity)
        } catch (e) {
            this.logger.error(
                `Push notification failed to send to device id ${device.id} with error ${e.message} -- ${e.stack}`
            )
            const entity = new PushNotification({
                deviceId: device.id,
                messageId: null,
                title: notification.title,
                body: notification.body,
                status: PushNotificationStatus.ERROR
            })
            await this.repository.save(entity)
        }
    }

    /**
     * @param devices
     * @param tag
     * @param notification
     * @param data
     */
    async sendNotificationToDevices<T extends { [key: string]: string }>(
        devices: UserDevice[],
        tag: PushNotificationTag,
        notification: admin.messaging.Notification,
        data: T = undefined
    ) {
        const allDevices = removeDuplicates(devices.map((device) => device.fcmToken))
        await mapAsync(allDevices, (messageResponse, index) => {
            const entity = new PushNotification({
                deviceId: devices[index].id,
                messageId: faker.random.alphaNumeric(10),
                title: notification.title,
                body: notification.body,
                status: PushNotificationStatus.SUCCESS
            })

            return this.repository.save(entity)
        })
    }

    async sendNotificationToDevicesWithBadge<T extends { [key: string]: string }>(
        devices: UserDevice[],
        tag: PushNotificationTag,
        notification: admin.messaging.Notification,
        badge: number = 0,
        data: T = undefined
    ) {
        const allDevices = removeDuplicates(devices.map((device) => device.fcmToken))
        await mapAsync(allDevices, (messageResponse, index) => {
            const entity = new PushNotification({
                deviceId: devices[index].id,
                messageId: faker.random.alphaNumeric(10),
                title: notification.title,
                body: notification.body,
                status: PushNotificationStatus.SUCCESS
            })

            return this.repository.save(entity)
        })
    }
}
