import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ExpenseContributionType } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { v4 as uuid } from 'uuid'
import { makeDinero } from '../utils/data.utils'
import { User } from './user.entity'

@Entity()
export class UserInvite {
    constructor(properties: Partial<UserInvite> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne((_) => SharedExpense, (expense) => expense.userInvites, {
        nullable: true
    })
    @JoinColumn()
    @Exclude()
    sharedExpense: Promise<SharedExpense>

    @Column({ nullable: true })
    sharedExpenseId: number

    @ManyToOne((_) => User, (user) => user.invites)
    @JoinColumn()
    @Exclude()
    initiatingUser: Promise<User>

    @Column({ nullable: false })
    initiatingUserId: number

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    //index is non-unique so that we can support the use case of inviting the same
    //non-user to multiple expense sharing agreements
    @Column({ nullable: false })
    @Index({ unique: false })
    email: string

    @Column({ nullable: false, type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string = uuid()

    // This should probably be a tinyint, but I caught this a bit too late.
    @Column({ nullable: false, type: 'int' })
    contributionType: ExpenseContributionType

    @Column({ nullable: true, type: 'int', comment: 'Stored in a form intended to be parsed by Dinero.js' })
    contributionValue: number

    @Column({ nullable: false })
    dateTimeCreated: Date = new Date()

    @Column({ nullable: false })
    isConverted: boolean = false

    @Column({ nullable: true })
    dateTimeBecameUser: Date

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
