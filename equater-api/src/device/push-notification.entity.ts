import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UserDevice } from './user-device.entity'

export enum PushNotificationStatus {
    ERROR,
    SUCCESS
}

@Entity()
export class PushNotification {
    constructor(properties: Partial<PushNotification> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => UserDevice, (user) => user.pushNotifications)
    @JoinColumn()
    @Exclude()
    device: Promise<UserDevice>

    @Column({ nullable: false })
    deviceId: number

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    messageId: string

    @Column({ nullable: true })
    title: string

    @Column({ nullable: true })
    body: string

    @Column({ nullable: false })
    dateTimeAttempted: Date = new Date()

    @Column({ nullable: false })
    status: PushNotificationStatus
}
