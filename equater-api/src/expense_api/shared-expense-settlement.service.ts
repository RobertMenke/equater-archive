import { Injectable, Logger } from '@nestjs/common'
import * as Dinero from 'dinero.js'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { mapAsync } from '../utils/data.utils'
import { ExpenseApiService } from './expense-api.service'

@Injectable()
export class SharedExpenseSettlementService {
    private logger = new Logger(SharedExpenseSettlementService.name)

    constructor(
        private readonly transactionPullService: TransactionPullService,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService
    ) {}

    async createTransactions(
        sharedExpense: SharedExpense,
        transaction: Transaction
    ): Promise<SharedExpenseTransaction[]> {
        const agreements = await this.sharedExpenseService.findManyAgreementsBy({
            sharedExpenseId: sharedExpense.id,
            isActive: true
        })

        return await mapAsync(agreements, async (agreement) => {
            const totalTransactionAmount = this.sharedExpenseService.computeVendorWebHookAmountOwed(
                agreements,
                agreement,
                transaction
            )
            const totalFeeAmount = this.sharedExpenseService.computeFee(agreement, totalTransactionAmount)
            const sharedExpenseTransaction = await this.createSharedExpenseTransaction(
                sharedExpense,
                agreement,
                transaction,
                totalTransactionAmount,
                totalFeeAmount
            )

            await this.sharedExpenseService.sendTransactionSocketUpdate(sharedExpenseTransaction)
            // Send out notifications to users indicating that the transaction has been completed
            await this.expenseApiService
                .notifyExpenseOwnerOfTransactionAttempt(sharedExpense, agreement, sharedExpenseTransaction)
                .catch(this.logger.error)
            await this.expenseApiService
                .notifyPayeeOfTransactionAttempt(sharedExpense, agreement, sharedExpenseTransaction)
                .catch(this.logger.error)

            return sharedExpenseTransaction
        })
    }

    private async createSharedExpenseTransaction(
        sharedExpense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        matchingTransaction: Transaction,
        amountOwed: Dinero.Dinero,
        totalFeeAmount: Dinero.Dinero
    ): Promise<SharedExpenseTransaction> {
        const destinationAccount = await sharedExpense.expenseOwnerDestinationAccount
        const destinationUser = await destinationAccount.user
        // Remember, the agreement's user is the user who has agreed to pay the bill
        const sourceUser = await agreement.user
        const sourceAccount = await agreement.paymentAccount

        const sharedExpenseTransaction = await this.sharedExpenseService.findOrCreateVendorWebHookTransaction(
            sharedExpense,
            agreement,
            destinationUser,
            destinationAccount,
            sourceUser,
            sourceAccount,
            totalFeeAmount,
            amountOwed,
            matchingTransaction
        )

        return await this.expenseApiService.createTransferOfFunds(
            sharedExpense,
            agreement,
            sharedExpenseTransaction,
            matchingTransaction
        )
    }
}
