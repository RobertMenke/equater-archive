import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Provider } from '../config/config.service'
import { DeviceService } from './device.service'
import { PushNotification } from './push-notification.entity'
import { PushNotificationService } from './push-notification.service'
import { UserDevice } from './user-device.entity'
import * as admin from 'firebase-admin'

@Module({
    imports: [TypeOrmModule.forFeature([UserDevice, PushNotification]), ConfigModule],
    providers: [
        DeviceService,
        PushNotificationService,
        {
            inject: [ConfigService],
            provide: Provider.FIREBASE_ADMIN,
            useFactory: (configService: ConfigService) =>
                admin.initializeApp({
                    credential: admin.credential.cert(configService.getFirebaseAdminSdkPrivateKey()),
                    databaseURL: 'https://equater.firebaseio.com'
                })
        }
    ],
    exports: [DeviceService, PushNotificationService]
})
export class DeviceModule {}
