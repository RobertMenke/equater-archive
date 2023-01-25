import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import {
    MAXIMUM_TRANSACTION_ATTEMPTS,
    SharedExpenseTransaction
} from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseWithheldTransaction } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { logError, mapNotNullAsync } from '../utils/data.utils'
import { ExpenseApiService } from './expense-api.service'

@Injectable()
export class WithheldTransactionCronService {
    private readonly logger = new Logger(WithheldTransactionCronService.name)

    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService
    ) {}

    @Cron('0 12 * * *')
    async processWithheldTransactions() {
        this.logger.log('Processing withheld transactions')
        const withheldTransactions = await this.sharedExpenseService.findWithheldPaymentsThatShouldBeSettled()
        this.logger.log(`Found ${withheldTransactions.length} transactions`)

        return await mapNotNullAsync(withheldTransactions, async (withheldTransaction) => {
            const transaction = await this.processWithheldTransaction(withheldTransaction)

            if (!transaction) {
                return null
            }

            await this.handleNotification(transaction)

            return await this.sharedExpenseService.findWithheldTransactionBy({ id: withheldTransaction.id })
        })
    }

    private async processWithheldTransaction(
        withheldTransaction: SharedExpenseWithheldTransaction
    ): Promise<SharedExpenseTransaction> {
        const transaction = await this.sharedExpenseService.findTransactionBy({
            id: withheldTransaction.sharedExpenseTransactionId
        })

        if (!transaction || transaction.numberOfTimesAttempted >= MAXIMUM_TRANSACTION_ATTEMPTS) {
            return null
        }

        const agreement = await withheldTransaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense

        // If the original expense is no longer active, mark the withheld transaction
        // as reconciled and don't continue processing
        if (!expense.isActive) {
            await this.sharedExpenseService.markWithheldTransactionsAsSettled(transaction)
            return null
        }

        try {
            return await this.expenseApiService.createTransferFromTransaction(transaction)
        } catch (e) {
            logError(this.logger, e)
            return null
        }
    }

    private async handleNotification(transaction: SharedExpenseTransaction) {
        const agreement = await transaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense
        await this.expenseApiService.notifyExpenseOwnerOfTransactionAttempt(expense, agreement, transaction)
        await this.expenseApiService.notifyPayeeOfTransactionAttempt(expense, agreement, transaction)
        await this.sharedExpenseService.sendTransactionSocketUpdate(transaction)
    }
}
