import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as admin from 'firebase-admin'
import { FindOptionsWhere, Repository } from 'typeorm'
import { Provider } from '../config/config.service'
import { mapAsync, removeDuplicates } from '../utils/data.utils'
import { PushNotification, PushNotificationStatus } from './push-notification.entity'
import { UserDevice } from './user-device.entity'

export enum PushNotificationTag {
    EXPENSE_CANCELLATION = 'EXPENSE_CANCELLATION',
    EXPENSE_AGREEMENT = 'EXPENSE_AGREEMENT',
    EXPENSE_TRANSACTION = 'EXPENSE_TRANSACTION',
    IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
    // A type of notification with no additional data or expected action
    NOTIFICATION = 'NOTIFICATION',
    PLAID_AUTHENTICATION = 'PLAID_AUTHENTICATION'
}

// See: https://firebase.google.com/docs/cloud-messaging/send-message
@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name)

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
        const payload: admin.messaging.Message = {
            token: device.fcmToken,
            notification,
            apns: {
                payload: {
                    aps: {
                        category: tag
                    }
                }
            },
            android: {
                data: data || undefined,
                notification: {
                    tag: tag
                }
            },
            data: data || undefined
        }

        try {
            const messageId = await this.client.messaging().send(payload)
            const entity = new PushNotification({
                deviceId: device.id,
                messageId: messageId,
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
        const payload: admin.messaging.MulticastMessage = {
            tokens: removeDuplicates(devices.map((device) => device.fcmToken)),
            notification,
            apns: {
                payload: {
                    aps: {
                        category: tag
                    }
                }
            },
            android: {
                data: data || undefined,
                notification: {
                    tag: tag
                }
            },
            data: data || undefined
        }

        const response = await this.client.messaging().sendMulticast(payload)

        await mapAsync(response.responses, (messageResponse, index) => {
            const entity = new PushNotification({
                deviceId: devices[index].id,
                messageId: messageResponse.messageId,
                title: notification.title,
                body: notification.body,
                status: messageResponse.success ? PushNotificationStatus.SUCCESS : PushNotificationStatus.ERROR
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
        const payload: admin.messaging.MulticastMessage = {
            tokens: removeDuplicates(devices.map((device) => device.fcmToken)),
            notification,
            apns: {
                payload: {
                    aps: {
                        category: tag,
                        badge: badge
                    }
                }
            },
            android: {
                data: data || undefined,
                notification: {
                    tag: tag
                }
            },
            data: data || undefined
        }

        const response = await this.client.messaging().sendMulticast(payload)

        await mapAsync(response.responses, (messageResponse, index) => {
            const entity = new PushNotification({
                deviceId: devices[index].id,
                messageId: messageResponse.messageId,
                title: notification.title,
                body: notification.body,
                status: messageResponse.success ? PushNotificationStatus.SUCCESS : PushNotificationStatus.ERROR
            })

            return this.repository.save(entity)
        })
    }
}
