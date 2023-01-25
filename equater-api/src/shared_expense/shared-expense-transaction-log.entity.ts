import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { DwollaWebhookEvent } from '../dwolla/dwolla-webhook.event'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'

@Entity()
export class SharedExpenseTransactionLog {
    constructor(props: Partial<SharedExpenseTransactionLog> = {}) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => SharedExpenseTransaction, (transaction) => transaction.logs)
    @JoinColumn()
    @Exclude()
    sharedExpenseTransaction: Promise<SharedExpenseTransaction>

    @Column({ nullable: false })
    @Index({ unique: false })
    sharedExpenseTransactionId: number

    @Column({
        nullable: false,
        comment:
            'Unique Event Id. An Event Id is used along with the created timestamp for idempotent event processing.'
    })
    @Column({ nullable: false, type: 'char', length: 36 })
    uuid: string

    @Column({ nullable: false, type: 'varchar', length: 255 })
    event: DwollaWebhookEvent

    @Column({ nullable: false })
    eventUrl: string

    @Column({ nullable: false, precision: 6 })
    dateTimePosted: Date = new Date()
}
