import { PlaidError } from '../../plaid/plaid.service'
import { SharedExpenseUserAgreement } from '../../shared_expense/shared-expense-user-agreement.entity'
import { UserAccount } from '../user-account.entity'

export class PlaidAuthenticationErrorEvent {
    constructor(
        public error: PlaidError,
        public readonly userAccount: UserAccount,
        public readonly agreement?: SharedExpenseUserAgreement
    ) {}
}
