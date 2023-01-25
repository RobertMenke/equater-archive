import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { encryptionTransformer } from '../utils/database.utils'

@Entity()
export class DwollaWebhookSubscription {
    constructor(fields: Partial<DwollaWebhookSubscription> = {}) {
        Object.assign(this, fields)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    @Index({ unique: true })
    uuid: string

    @Column({ nullable: false, transformer: encryptionTransformer, type: 'text' })
    secret: string

    @Column({ nullable: false })
    dwollaSubscriptionUrl: string

    @Column({ nullable: false, type: 'boolean' })
    isActive: boolean

    @Column({ nullable: false, type: 'datetime' })
    dateTimeCreated: Date = new Date()

    @Column({ nullable: true, type: 'datetime' })
    dateTimeUpdated: Date
}
