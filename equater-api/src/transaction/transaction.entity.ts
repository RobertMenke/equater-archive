import { Exclude, Transform } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseWithheldTransaction } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { makeDinero } from '../utils/data.utils'
import { UniqueVendor } from './unique-vendor.entity'
import * as Dinero from 'dinero.js'

export enum PlaidWebHookCode {
    INITIAL_UPDATE,
    HISTORICAL_UPDATE,
    DEFAULT_UPDATE,
    DIRECT_API_QUERY
}

@Entity()
export class Transaction {
    constructor(properties: Partial<Transaction> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @ManyToOne(() => UserAccount, (account) => account.transactions)
    @Exclude()
    @JoinColumn()
    account: Promise<UserAccount>

    @Column({ nullable: false })
    accountId: number

    @ManyToOne(() => UniqueVendor, (vendor) => vendor.transactions)
    @Exclude()
    @JoinColumn()
    uniqueVendor: Promise<UniqueVendor>

    @Column({ nullable: false })
    uniqueVendorId: number

    @OneToMany(() => SharedExpenseTransaction, (log) => log.plaidTransaction)
    @Exclude()
    expenseLog: Promise<SharedExpenseTransaction[]>

    @OneToMany(() => SharedExpenseWithheldTransaction, (transaction) => transaction.plaidTransaction)
    @Exclude()
    withheldTransactions: Promise<SharedExpenseTransaction[]>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    categoryId: string

    @Column({ nullable: true })
    pendingTransactionId: string = null

    @Column({ nullable: false })
    @Index({ unique: true })
    transactionId: string

    @Column({ nullable: true })
    accountOwner: string = null

    @Column({
        nullable: false,
        type: 'int',
        comment:
            'The settled dollar value. Positive values when money moves out of the account; negative values when money moves in. For example, purchases are positive; credit card payments, direct deposits, refunds are negative.',
        transformer: {
            from(value: number): Dinero.Dinero {
                return makeDinero(value)
            },
            to(value: Dinero.Dinero): number {
                return value.getAmount()
            }
        }
    })
    @Transform(({ value }) => value.getAmount(), { toPlainOnly: true })
    amount: Dinero.Dinero

    @Column({
        nullable: false,
        type: 'date',
        comment:
            'For pending transactions, Plaid returns the date the transaction occurred; for posted transactions, Plaid returns the date the transaction posts. Both dates are returned in an ISO 8601 format (YYYY-MM-DD).'
    })
    date: Date

    @Column({
        nullable: true,
        comment: 'The date that the transaction was authorized. Dates are returned in an ISO 8601 format (YYYY-MM-DD).'
    })
    authorizedDate: Date

    @Column({ nullable: false, comment: 'DateTime that we recorded the transaction from Plaid' })
    dateTimeCaptured: Date

    @Column({ nullable: true })
    isoCurrencyCode: string = null

    @Column({ nullable: false, type: 'tinyint' })
    isPending: boolean = false

    @Column({ nullable: true })
    transactionType: string

    @Column({ nullable: true })
    unofficialCurrencyCode: string

    @Column({ nullable: false })
    plaidWebHookCode: PlaidWebHookCode

    @Column({
        nullable: true,
        comment:
            'The channel used to make a payment. Possible values are: online, in store, other. This field will replace the transaction_type field.'
    })
    paymentChannel: string

    /////////////////////
    // Location meta data
    /////////////////////
    @Column({ nullable: true, type: 'varchar', length: 255 })
    address: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    city: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    country: string | null

    @Column({ nullable: true, type: 'decimal', precision: 6, scale: 2 })
    latitude: number | null

    @Column({ nullable: true, type: 'decimal', precision: 6, scale: 2 })
    longitude: number | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    postalCode: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    region: string | null

    @Column({
        nullable: true,
        comment: 'The merchant defined store number where the transaction occurred.',
        type: 'varchar',
        length: 255
    })
    storeNumber: string | null

    /////////////////////
    // Payment meta data
    /////////////////////
    @Column({ nullable: true, type: 'varchar', length: 255 })
    byOrderOf: string | null

    @Column({
        nullable: true,
        comment: 'For transfers, the party that is receiving the transaction.',
        type: 'varchar',
        length: 255
    })
    payee: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    payer: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    paymentMethod: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    paymentProcessor: string | null

    @Column({ nullable: true, comment: 'The ACH PPD ID for the payer.', type: 'varchar', length: 255 })
    ppdId: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    reason: string | null

    @Column({
        nullable: true,
        comment: 'The transaction reference number supplied by the financial institution.',
        type: 'varchar',
        length: 255
    })
    referenceNumber: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    transactionName: string = null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    merchantName: string = null
}
