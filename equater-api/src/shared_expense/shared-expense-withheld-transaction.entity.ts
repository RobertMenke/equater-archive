import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Transaction } from '../transaction/transaction.entity'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from './shared-expense-user-agreement.entity'

// Reasons 1-6 taken from https://docs.dwolla.com/#initiate-a-transfer
export enum SharedExpenseWithholdingReason {
    DESTINATION_IS_NOT_VERIFIED,
    INSUFFICIENT_FUNDS,
    FUNDING_SOURCE_NOT_FOUND,
    INVALID_FUNDING_SOURCE,
    TRANSFER_META_DATA_NOT_SUPPORTED,
    SENDER_RECEIVER_RESTRICTED,
    INVALID_ACCESS_TOKEN,
    FORBIDDEN,
    UNKNOWN,
    UNABLE_TO_GET_REAL_TIME_BALANCE
}

// There can be many withheld transactions for 1 transaction because each time a transaction is withheld it can be for a different reason
@Entity()
export class SharedExpenseWithheldTransaction {
    constructor(properties: Partial<SharedExpenseWithheldTransaction> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => SharedExpenseUserAgreement, (agreement) => agreement.withheldTransactions)
    @JoinColumn()
    @Exclude()
    sharedExpenseUserAgreement: Promise<SharedExpenseUserAgreement>

    @Column({ nullable: false })
    sharedExpenseUserAgreementId: number

    @ManyToOne(() => SharedExpenseTransaction, (transaction) => transaction.withheldTransactions, {
        nullable: true
    })
    @JoinColumn()
    @Exclude()
    sharedExpenseTransaction: Promise<SharedExpenseTransaction>

    @Column({ nullable: true })
    sharedExpenseTransactionId: number

    @ManyToOne(() => Transaction, (transaction) => transaction.withheldTransactions, {
        nullable: true
    })
    @JoinColumn()
    @Exclude()
    plaidTransaction: Promise<Transaction>

    @Column({ nullable: true })
    plaidTransactionId: number = null

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    withholdingReason: SharedExpenseWithholdingReason = SharedExpenseWithholdingReason.INSUFFICIENT_FUNDS

    @Column({ nullable: true })
    fundsAvailableAtTimeOfAttemptedTransaction: number

    @Column({ nullable: false, comment: 'Amount the user was supposed to contribute to this transaction' })
    totalContributionAmount: number

    @Column({ nullable: false, precision: 6 })
    dateTimeAttempted: Date = new Date()

    @Column({ nullable: false })
    hasBeenReconciled: boolean = false

    @Column({ nullable: true, precision: 6 })
    dateTimeReconciled: Date = null

    @Column({ nullable: true, comment: 'Used to uniquely identify recurring payments', precision: 6 })
    dateTimeOriginalPaymentScheduled: Date = null
}
