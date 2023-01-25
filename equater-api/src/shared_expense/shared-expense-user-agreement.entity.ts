import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { makeDinero } from '../utils/data.utils'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'
import { SharedExpenseWithheldTransaction } from './shared-expense-withheld-transaction.entity'
import { SharedExpense } from './shared-expense.entity'
import { v4 as uuid } from 'uuid'

export enum ExpenseContributionType {
    PERCENTAGE = 0,
    FIXED = 1,
    SPLIT_EVENLY = 2
}

@Entity()
export class SharedExpenseUserAgreement {
    constructor(properties: Partial<SharedExpenseUserAgreement> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @ManyToOne(() => SharedExpense, (sharedExpense) => sharedExpense.userAgreements)
    @JoinColumn()
    @Exclude()
    sharedExpense: Promise<SharedExpense>

    @Column({ nullable: false })
    sharedExpenseId: number

    @ManyToOne(() => User, (user) => user.sharedExpenseComponents)
    @JoinColumn()
    @Exclude()
    user: Promise<User>

    @Column({ nullable: false })
    userId: number

    @ManyToOne(() => UserAccount, (account) => account.sharedExpenseUserAgreements)
    @JoinColumn({ name: 'paymentAccountId' })
    @Exclude()
    paymentAccount: Promise<UserAccount>

    @Column({ nullable: true })
    paymentAccountId: number | null = null

    @OneToMany(() => SharedExpenseTransaction, (log) => log.sharedExpense)
    @Exclude()
    sharedExpenseTransactions: Promise<SharedExpenseTransaction[]>

    @OneToMany(() => SharedExpenseWithheldTransaction, (transaction) => transaction.sharedExpenseUserAgreement)
    @Exclude()
    withheldTransactions: Promise<SharedExpenseWithheldTransaction[]>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string = uuid()

    @Column({ nullable: false })
    contributionType: ExpenseContributionType

    @Column({
        nullable: true,
        type: 'int',
        comment:
            'Stored in a form intended to be parsed by Dinero.js. Will be null in the case that ExpenseContributionType.SPLIT_EVENLY is selected.'
    })
    contributionValue: number

    @Column({ nullable: false })
    isPending: boolean

    @Column({ nullable: false })
    isActive: boolean

    @Column({ nullable: false })
    dateTimeCreated: Date

    @Column({ nullable: true })
    dateTimeBecameActive: Date

    @Column({ nullable: true })
    dateTimeBecameInactive: Date

    getAgreementDescription(name: string) {
        switch (this.contributionType) {
            case ExpenseContributionType.SPLIT_EVENLY:
                return `split the cost of ${name} evenly`
            case ExpenseContributionType.PERCENTAGE:
                return `pay ${this.contributionValue}% of the cost of ${name}`
            case ExpenseContributionType.FIXED:
                const amount = makeDinero(this.contributionValue)

                return `pay ${amount.toFormat('$0,0.00')} for ${name}`
        }
    }
}
