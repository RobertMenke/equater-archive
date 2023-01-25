import { Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { IsNull } from 'typeorm'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { logError, mapNotNullAsync } from '../utils/data.utils'
import { ExpenseApiService } from './expense-api.service'

export class VerificationCompleteEvent {
    constructor(public readonly userId: number) {}
}

@EventsHandler(VerificationCompleteEvent)
export class VerificationCompleteHandler implements IEventHandler<VerificationCompleteEvent> {
    private readonly logger = new Logger(VerificationCompleteHandler.name)

    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService
    ) {}

    async handle(event: VerificationCompleteEvent) {
        const transactions = await this.sharedExpenseService.findManyTransactionsBy({
            destinationUserId: event.userId,
            dwollaTransferUrl: IsNull()
        })

        if (transactions.length === 0) {
            return []
        }

        this.logger.log(`Found ${transactions.length} outstanding transactions for user ${event.userId}`)
        return await mapNotNullAsync(transactions, (transaction) => this.processTransaction(transaction))
    }

    private async processTransaction(transaction: SharedExpenseTransaction) {
        if (!transaction) {
            return null
        }

        try {
            return this.expenseApiService.createTransferFromTransaction(transaction)
        } catch (e) {
            logError(this.logger, e)
            return null
        }
    }
}
