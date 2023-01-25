import { Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionService } from '../transaction/transaction.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { User } from '../user/user.entity'
import { filterAsync, flatMapAsync, logError } from '../utils/data.utils'
import { TransactionsUpdateEvent } from './events/transactions-update.event'
import { SharedExpenseSettlementService } from './shared-expense-settlement.service'

@EventsHandler(TransactionsUpdateEvent)
export class TransactionsUpdateHandler implements IEventHandler<TransactionsUpdateEvent> {
    private readonly logger = new Logger(TransactionsUpdateHandler.name)

    constructor(
        private readonly transactionPullService: TransactionPullService,
        private readonly transactionService: TransactionService,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly settlementService: SharedExpenseSettlementService
    ) {}

    /**
     * Edge cases:
     * - multiple transactions matching a shared expense
     *
     * @param event
     */
    async handle(event: TransactionsUpdateEvent) {
        try {
            const transactions = await filterAsync(event.transactions, async (transaction) => {
                return !(await this.transactionHasBeenHandled(transaction))
            })
            this.logger.verbose(`Created ${transactions.length} transactions`)
            const uniqueVendorIds = transactions.map((transaction) => transaction.uniqueVendorId)
            const matchingSharedExpenses = await this.findSharedExpensesMatchingVendors(event.user, uniqueVendorIds)
            this.logger.verbose(`Found ${matchingSharedExpenses.length} matching shared expenses`)
            if (matchingSharedExpenses.length === 0) {
                return
            }

            for (const expense of matchingSharedExpenses) {
                const matchingTransactions = transactions.filter(
                    (transaction) => transaction.uniqueVendorId === expense.uniqueVendorId
                )

                await this.createSharedExpenseTransactions(expense, matchingTransactions)
            }
        } catch (err) {
            logError(this.logger, err)
        }
    }

    private createSharedExpenseTransactions(
        sharedExpense: SharedExpense,
        matchingTransactions: Transaction[]
    ): Promise<SharedExpenseTransaction[]> {
        return flatMapAsync(matchingTransactions, async (transaction) => {
            return this.settlementService.createTransactions(sharedExpense, transaction)
        })
    }

    private findSharedExpensesMatchingVendors(user: User, vendorIds: number[]) {
        return this.sharedExpenseService.findSharedExpensesMatchingVendor(user, vendorIds)
    }

    /**
     * Transactions will be handled as soon as we receive them even if they're pending.
     * The idea is that we want to settle up as quickly as possible (ACH is already slow).
     *
     * If we then receive the transaction again when it's been posted we'll store it, but
     * we won't create an additional expense.
     *
     * Note: Not all institutions will post pending transaction data and will
     * only send posted transactions.
     *
     * TODO: We do need to handle the scenario where a pending transaction is processed
     * TODO: but then the transaction ultimately fails for some reason.
     *
     * @see https://plaid.com/docs/transactions/transactions-data/
     *
     * @param transaction
     *
     * @private
     */
    private async transactionHasBeenHandled(transaction: Transaction): Promise<boolean> {
        if (transaction.isPending || !transaction.pendingTransactionId) {
            return false
        }

        const pendingTransaction = await this.transactionService.findTransactionBy({
            transactionId: transaction.pendingTransactionId
        })

        if (!pendingTransaction) {
            return false
        }

        const sharedExpenses = await this.sharedExpenseService.findManyTransactionsBy({
            plaidTransactionId: pendingTransaction.id
        })

        return sharedExpenses.length > 0
    }
}
