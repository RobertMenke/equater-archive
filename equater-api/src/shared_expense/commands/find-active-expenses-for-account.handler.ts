import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UserService } from '../../user/user.service'
import { SharedExpense } from '../shared-expense.entity'
import { SharedExpenseService } from '../shared-expense.service'
import { FindActiveExpensesForAccountCommand } from './find-active-expenses-for-account.command'

@CommandHandler(FindActiveExpensesForAccountCommand)
export class FindActiveExpensesForAccountHandler implements ICommandHandler<FindActiveExpensesForAccountCommand> {
    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly userService: UserService
    ) {}

    /**
     * Find active shared expenses for a given account
     *
     * @param command
     */
    async execute(command: FindActiveExpensesForAccountCommand): Promise<SharedExpense[]> {
        const account = command.account
        const user = await this.userService.findOneWhere({
            id: account.userId
        })
        const activeSharedExpenses = await this.sharedExpenseService.getSharedExpensesForUser(user, {
            isActive: true
        })

        const activeSharedExpensesForAccount = []

        for (const expense of activeSharedExpenses) {
            const accountIsExpenseOwnerAccount =
                expense.expenseOwnerSourceAccountId === account.id ||
                expense.expenseOwnerDestinationAccountId === account.id

            if (accountIsExpenseOwnerAccount) {
                activeSharedExpensesForAccount.push(expense)
            }

            // If the user isn't the expense owner, find agreements for this expense
            // that may include this account
            if (expense.expenseOwnerUserId !== user.id) {
                const agreements = await expense.userAgreements
                const agreementWithAccount = agreements
                    .filter((agreement) => agreement.isActive)
                    .find((agreement) => agreement.paymentAccountId === account.id)

                if (agreementWithAccount) {
                    activeSharedExpensesForAccount.push(expense)
                }
            }
        }

        return activeSharedExpensesForAccount
    }
}
