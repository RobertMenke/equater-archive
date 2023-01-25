import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { UserInvite } from '../user/user-invite.entity'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { SharedExpenseUserAgreement } from './shared-expense-user-agreement.entity'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'
import { v4 as uuid } from 'uuid'

export enum SharedExpenseType {
    SHARED_BILL = 0,
    RECURRING_PAYMENT = 1
}

export enum RecurringExpenseInterval {
    DAYS,
    MONTHS
}

@Entity()
export class SharedExpense {
    constructor(properties: Partial<SharedExpense> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    //Can be null in the case that this agreement is "at a date and time" rather than
    //"When a vendor charges me"
    @ManyToOne(() => UniqueVendor, (vendor) => vendor.sharedExpenses, {
        nullable: true
    })
    @JoinColumn()
    @Exclude()
    uniqueVendor: Promise<UniqueVendor>

    @Column({ nullable: true })
    uniqueVendorId: number

    @ManyToOne(() => User, (user) => user.sharedExpenses)
    @JoinColumn({ name: 'expenseOwnerUserId' })
    @Exclude()
    user: Promise<User>

    @Column({ nullable: false })
    expenseOwnerUserId: number

    @ManyToOne(() => UserAccount, (account) => account.sharedExpensesWithSourceAccount)
    @JoinColumn({ name: 'expenseOwnerSourceAccountId' })
    @Exclude()
    expenseOwnerSourceAccount: Promise<UserAccount>

    @Column({
        nullable: false,
        comment:
            'The account used to detect a matching shared expense. This account may be a credit card or a depository account.'
    })
    expenseOwnerSourceAccountId: number = null

    @ManyToOne(() => UserAccount, (account) => account.sharedExpensesWithDestinationAccount)
    @JoinColumn({ name: 'expenseOwnerDestinationAccountId' })
    @Exclude()
    expenseOwnerDestinationAccount: Promise<UserAccount>

    @Column({
        nullable: false,
        comment:
            'The account used to create deposits/withdrawals for payments. This account must be a depository account.'
    })
    expenseOwnerDestinationAccountId: number = null

    @OneToMany(() => SharedExpenseUserAgreement, (component) => component.sharedExpense)
    @Exclude()
    userAgreements: Promise<SharedExpenseUserAgreement[]>

    @OneToMany(() => SharedExpenseTransaction, (log) => log.sharedExpense)
    @Exclude()
    sharedExpenseTransactions: Promise<SharedExpenseTransaction[]>

    @OneToMany(() => UserInvite, (invite) => invite.sharedExpense)
    @Exclude()
    userInvites: Promise<UserInvite[]>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string = uuid()

    @Column({ nullable: false, default: '', length: 1024 })
    expenseNickName: string = ''

    @Column({ nullable: false, precision: 6 })
    dateTimeCreated: Date

    @Column({ nullable: false })
    isActive: boolean

    @Column({ nullable: false })
    isPending: boolean

    @Column({ nullable: false, type: 'tinyint' })
    sharedExpenseType: SharedExpenseType

    @Column({ nullable: true, type: 'tinyint' })
    expenseRecurrenceInterval: RecurringExpenseInterval

    //This field is only relevant for [SharedExpenseType.RECURRING_PAYMENT] agreements
    //Transitive dependency :(
    //This column should be interpreted based on the expenseRecurrenceInterval. For example,
    //[RecurringExpenseInterval.MONTHS] && expenseRecurrenceFrequency == 2 means every 2 months
    //[RecurringExpenseInterval.DAYS] && expenseRecurrenceFrequency == 10 means every 10 days
    @Column({ nullable: true, type: 'int' })
    expenseRecurrenceFrequency: number

    //This field is only relevant for [SharedExpenseType.RECURRING_PAYMENT] agreements
    //Transitive dependency :(
    //This represents the first date that the user will charge another user at which point
    //the payee will be charged every [expenseRecurrenceInDays] days
    @Column({ nullable: true, precision: 6 })
    targetDateOfFirstCharge: Date

    @Column({ nullable: true, precision: 6 })
    dateLastCharged: Date

    // recurring-payment only
    @Column({ nullable: true, precision: 6 })
    dateNextPaymentScheduled: Date

    // recurring-payment only
    @Column({ nullable: true, precision: 6 })
    recurringPaymentEndDate: Date

    @Column({ nullable: true, precision: 6 })
    dateTimeDeactivated: Date

    getExpenseFrequencyDescription() {
        if (!this.expenseRecurrenceInterval || !this.expenseRecurrenceFrequency) {
            return ''
        }

        const interval = this.expenseRecurrenceInterval === RecurringExpenseInterval.MONTHS ? 'month' : 'day'
        const intervalDescription = this.expenseRecurrenceFrequency === 1 ? interval : `${interval}s`

        return `${this.expenseRecurrenceFrequency} ${intervalDescription}`
    }
}
