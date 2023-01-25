import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../user/user.entity'
import { PushNotification } from './push-notification.entity'

@Entity()
export class UserDevice {
    constructor(properties: Partial<UserDevice> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => User, (user) => user.devices)
    @JoinColumn()
    user: Promise<User>

    @Column({ nullable: false })
    userId: number

    @OneToMany(() => PushNotification, (notification) => notification.device)
    pushNotifications: Promise<PushNotification[]>

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        nullable: true,
        comment:
            'We want to allow the same device to be registered to multiple users, but we will need to make sure to filter duplicates when sending notification'
    })
    @Index({ unique: false })
    fcmToken: string

    @Column({ nullable: true })
    deviceModel: string

    @Column({ nullable: true })
    deviceOsVersion: string

    @Column({ nullable: true })
    deviceOsName: string

    @Column({ nullable: false })
    dateTimeDeviceRegistered: Date = new Date()
}
