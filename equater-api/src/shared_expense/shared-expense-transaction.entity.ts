import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DwollaTransferStatus } from '../dwolla/dwolla.types'
import { Transaction } from '../transaction/transaction.entity'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { SharedExpenseTransactionLog } from './shared-expense-transaction-log.entity'
import { SharedExpenseUserAgreement } from './shared-expense-user-agreement.entity'
import { SharedExpenseWithheldTransaction } from './shared-expense-withheld-transaction.entity'
import { SharedExpense } from './shared-expense.entity'
import { v4 as uuid } from 'uuid'

export const MAXIMUM_TRANSACTION_ATTEMPTS = 5

@Entity()
export class SharedExpenseTransaction {
    constructor(properties: Partial<SharedExpenseTransaction> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    //Can be null in the case that this agreement is "at a date and time" rather than
    //"When a vendor charges me"
    @ManyToOne(() => Transaction, (transaction) => transaction.expenseLog, {
        nullable: true
    })
    @JoinColumn()
    @Exclude()
    plaidTransaction: Promise<Transaction>

    @Column({ nullable: true })
    plaidTransactionId: number = null

    @ManyToOne(() => SharedExpense, (expense) => expense.sharedExpenseTransactions)
    @JoinColumn()
    @Exclude()
    sharedExpense: Promise<SharedExpense>

    @Column({ nullable: false })
    sharedExpenseId: number

    @ManyToOne(() => SharedExpenseUserAgreement, (component) => component.sharedExpenseTransactions)
    @JoinColumn()
    @Exclude()
    sharedExpenseUserAgreement: Promise<SharedExpenseUserAgreement>

    @Column({ nullable: false })
    sharedExpenseUserAgreementId: number

    @ManyToOne(() => UserAccount, (component) => component.sharedSourceExpenseTransactions)
    @JoinColumn()
    @Exclude()
    sourceAccount: Promise<UserAccount>

    @Column({ nullable: false })
    sourceAccountId: number

    @ManyToOne(() => UserAccount, (component) => component.sharedDestinationExpenseTransactions)
    @JoinColumn()
    @Exclude()
    destinationAccount: Promise<UserAccount>

    @Column({ nullable: false })
    destinationAccountId: number

    @ManyToOne(() => User, (user) => user.paidTransactions)
    @JoinColumn()
    @Exclude()
    sourceUser: Promise<User>

    @Column({ nullable: false })
    sourceUserId: number

    @ManyToOne(() => User, (user) => user.receivedTransactions)
    @JoinColumn()
    @Exclude()
    destinationUser: Promise<User>

    @Column({ nullable: false })
    destinationUserId: number

    @OneToMany(() => SharedExpenseTransactionLog, (log) => log.sharedExpenseTransaction)
    @Exclude()
    logs: Promise<SharedExpenseTransactionLog[]>

    @OneToMany(() => SharedExpenseWithheldTransaction, (transaction) => transaction.sharedExpenseTransaction)
    @Exclude()
    withheldTransactions: Promise<SharedExpenseWithheldTransaction[]>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'char', length: 36 })
    uuid: string = uuid()

    @Column({ nullable: false, type: 'int', comment: 'Total contributionValue owed by the source to the destination' })
    totalTransactionAmount: number

    @Column({
        nullable: false,
        type: 'int',
        comment: 'Total contributionValue that we will charge as a service fee for this transaction'
    })
    totalFeeAmount: number

    @Column({
        nullable: false,
        type: 'char',
        length: 36,
        comment: 'Token used to ensure we do not charge users more than once for the same transaction'
    })
    @Index({ unique: true })
    idempotencyToken: string = uuid()

    @Column({ nullable: false, precision: 6 })
    dateTimeInitiated: Date

    @Column({ nullable: false })
    hasBeenTransferredToDestination: boolean = false

    @Column({ nullable: true, precision: 6 })
    dateTimeTransferredToDestination: Date = null

    @Column({ nullable: false, default: 0 })
    numberOfTimesAttempted: number

    @Column({
        nullable: true,
        precision: 6,
        comment:
            'For recurring payments we need to be able to identify a transaction by the date the payment was originally scheduled'
    })
    dateTimeTransactionScheduled: Date = null

    @Column({ nullable: true })
    dwollaTransferUrl: string

    @Column({ nullable: true })
    @Index({ unique: true })
    dwollaTransferId: string

    @Column({ nullable: true, type: 'varchar', length: 255 })
    dwollaStatus: DwollaTransferStatus

    @Column({ nullable: true })
    dateTimeDwollaStatusUpdated: Date
}
