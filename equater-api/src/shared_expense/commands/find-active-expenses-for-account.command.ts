import { UserAccount } from '../../user_account/user-account.entity'

export class FindActiveExpensesForAccountCommand {
    constructor(public readonly account: UserAccount) {}
}
