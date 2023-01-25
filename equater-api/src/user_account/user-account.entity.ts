import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { encryptionTransformer, nullableEncryptionTransformer } from '../utils/database.utils'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { Transaction } from '../transaction/transaction.entity'
import { User } from '../user/user.entity'
import { PlaidInstitution } from './plaid-institution.entity'

/**
 * Notes on UserAccount
 * ----------------------------
 *
 * Linking with Plaid:
 *
 * Prior to having any user account on file, we need a plaid access token in order
 * for a user to link their first account, therefore, the User entity must store a plaid
 * link token. The User entity does not need to maintain whether that user requires
 * re-authentication with Plaid. A User does, however, always need to have a valid
 * plaid token while the user is using the app in case the user chooses to link
 * an additional account.
 *
 * The UserAccount entity is responsible for handling updates, therefore, the UserAccount
 * entity needs to have plaidLinkToken, dateTimePlaidLinkTokenExpires, and requiresPlaidReAuthentication
 * fields. When a user signs in or opens the app and fetches the latest user state,
 * each account will have to create a new link token if necessary.
 */
@Entity()
export class UserAccount {
    constructor(properties: Partial<UserAccount> = {}) {
        Object.assign(this, properties)
    }

    assign(properties: Partial<UserAccount> = {}): UserAccount {
        Object.assign(this, properties)

        return this
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne((_) => User, (user) => user.userAccounts)
    @JoinColumn()
    @Exclude()
    user: Promise<User>

    @Column({ nullable: false })
    userId: number

    @OneToMany(() => SharedExpense, (expense) => expense.expenseOwnerSourceAccount)
    @Exclude()
    sharedExpensesWithSourceAccount: SharedExpense[]

    @OneToMany(() => SharedExpense, (expense) => expense.expenseOwnerDestinationAccount)
    @Exclude()
    sharedExpensesWithDestinationAccount: SharedExpense[]

    @OneToMany(() => SharedExpenseUserAgreement, (agreement) => agreement.paymentAccount)
    @Exclude()
    sharedExpenseUserAgreements: SharedExpenseUserAgreement[]

    @OneToMany(() => Transaction, (transaction) => transaction.account)
    @Exclude()
    transactions: Transaction[]

    @OneToMany(() => SharedExpenseTransaction, (transaction) => transaction.sourceAccount)
    @Exclude()
    sharedSourceExpenseTransactions: SharedExpenseTransaction[]

    @OneToMany(() => SharedExpenseTransaction, (transaction) => transaction.destinationAccount)
    @Exclude()
    sharedDestinationExpenseTransactions: SharedExpenseTransaction[]

    @ManyToOne(() => PlaidInstitution, (institution) => institution.userAccounts)
    @JoinColumn()
    @Exclude()
    plaidInstitution: Promise<PlaidInstitution>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    @Index({ unique: true })
    accountId: string

    @Column({ nullable: false })
    accountName: string

    @Column({ nullable: false })
    accountSubType: string

    @Column({ nullable: false })
    accountType: string

    @Column({ nullable: false, type: 'text', transformer: encryptionTransformer })
    @Exclude()
    accountMask: string

    @Column({ nullable: false })
    institutionId: string

    @Column({
        nullable: false,
        comment: 'This is the foreign key for our database table representing an institution and its metadata'
    })
    plaidInstitutionId: number

    @Column({ nullable: false })
    institutionName: string

    /**
     * These tokens are for 1-time use and should be used to retrieve an access token.
     * Access tokens never expire, should be stored securely, and should never be sent to clients
     */
    @Column({ nullable: true, type: 'text', transformer: nullableEncryptionTransformer })
    @Exclude()
    plaidPublicToken: string = null

    @Column({ nullable: true, type: 'text', transformer: nullableEncryptionTransformer })
    @Exclude()
    plaidAccessToken: string = null

    @Column({ nullable: true })
    @Index({ unique: false })
    @Exclude()
    plaidItemId: string = null

    @Column({
        nullable: false,
        default: false,
        comment:
            'Indicates whether or not the user has explicitly linked this account with Equater. If not, we do not want to match shared bills for this account since we have not been given explicit permission.'
    })
    isActive: boolean = false

    @Column({ nullable: false, default: false })
    hasRemovedFundingSource: boolean = false

    @Column({ nullable: true })
    dwollaFundingSourceId: string

    @Column({ nullable: true })
    @Exclude()
    dwollaFundingSourceUrl: string

    @Column({ nullable: true })
    dateOfLastPlaidTransactionPull: Date = null

    @Column({ default: false })
    requiresPlaidReAuthentication: boolean = false

    @Column({ nullable: true })
    dateTimeCreated: Date = new Date()
}

export interface SerializedUserAccount extends UserAccount {
    institution: PlaidInstitution
    linkTokens: PlaidLinkToken[]
}
