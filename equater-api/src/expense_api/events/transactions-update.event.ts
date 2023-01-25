import { Transaction } from '../../transaction/transaction.entity'
import { User } from '../../user/user.entity'
import { UserAccount } from '../../user_account/user-account.entity'

export class TransactionsUpdateEvent {
    constructor(
        public readonly user: User,
        public readonly account: UserAccount,
        public readonly transactions: Transaction[]
    ) {}
}
