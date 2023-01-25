import {
    InjectQueue,
    OnQueueActive,
    OnQueueCompleted,
    OnQueueDrained,
    OnQueueError,
    OnQueueProgress,
    Process,
    Processor
} from '@nestjs/bull'
import { Logger, OnModuleInit } from '@nestjs/common'
import { Job, Queue } from 'bull'
import * as Dinero from 'dinero.js'
import { ConfigService, QueueProcessor, Queues } from '../config/config.service'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { logError } from '../utils/data.utils'
import { ExpenseApiService } from './expense-api.service'
import { RecurrentPaymentJob, RecurrentPaymentNotificationJob } from './recurrent-payment.job'

@Processor(Queues.RECURRENT_PAYMENTS)
export class RecurrentPaymentProcessor implements OnModuleInit {
    private readonly logger = new Logger(RecurrentPaymentProcessor.name)

    // Parameter that can be set for testing not to run a job. For example, testing the cron job's queuing
    // mechanism in isolation
    // TODO: This testing artifact should not be in the real implementation. Move this into a fake that references the real implementation
    static SHOULD_HANDLE_JOBS = true

    async onModuleInit() {
        this.logger.log(`========== Printing ${RecurrentPaymentProcessor.name} stats ==========`)
        this.logger.log(JSON.stringify(await this.queue.getJobCounts()))
        this.logger.log(`==============================================================`)
    }

    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService,
        private readonly configService: ConfigService,
        @InjectQueue(Queues.RECURRENT_PAYMENTS)
        private readonly queue: Queue
    ) {}

    @Process(QueueProcessor.RECURRENT_PAYMENT)
    async processRecurrentPayment(job: Job<RecurrentPaymentJob>) {
        try {
            this.logger.log(`Processing recurring payment -- job id ${job.id}`)
            // During some tests, we want to disable queue processing
            if (this.configService.isTesting() && !RecurrentPaymentProcessor.SHOULD_HANDLE_JOBS) {
                return
            }
            // Gather information about the transaction
            const data = job.data
            this.logger.log(`Processing recurring payment agreement -- agreement uuid ${data.uuid}`)
            const sharedExpense = await this.sharedExpenseService.findSharedExpenseBy({ id: data.sharedExpenseId })
            const agreement = await this.sharedExpenseService.findAgreementBy({ id: data.sharedExpenseUserAgreementId })
            // Compute the amounts that will be transacted
            const totalTransactionAmount = this.sharedExpenseService.computeRecurringPaymentAmountOwed(agreement)
            const totalFeeAmount = this.sharedExpenseService.computeFee(agreement, totalTransactionAmount)
            this.logger.log(
                `Creating shared expense transaction for -- shared expense ${sharedExpense.id} -- agreement ${agreement.id}`
            )
            // Complete the transaction
            const sharedExpenseTransaction = await this.createSharedExpenseTransaction(
                sharedExpense,
                agreement,
                totalTransactionAmount,
                totalFeeAmount
            )

            // Schedule the next recurrent payment if the payment went through
            if (sharedExpenseTransaction.dwollaTransferUrl !== null) {
                this.logger.log(
                    `Recurring payment initiated for shared expense ${sharedExpense.id} and agreement ${agreement.id} via shared expense transaction ${sharedExpenseTransaction.id} -- now scheduling next recurring payment`
                )
                await this.sharedExpenseService.scheduleNextRecurringPayment(sharedExpense)
            }

            this.logger.log(
                `Sending notifications for shared expense ${sharedExpense.id} and agreement ${agreement.id}`
            )
            await this.sharedExpenseService.sendTransactionSocketUpdate(sharedExpenseTransaction)
            // Send out notifications to users indicating that the transaction has been completed
            await this.expenseApiService
                .notifyExpenseOwnerOfTransactionAttempt(sharedExpense, agreement, sharedExpenseTransaction)
                .catch((e) => logError(this.logger, e))
            await this.expenseApiService
                .notifyPayeeOfTransactionAttempt(sharedExpense, agreement, sharedExpenseTransaction)
                .catch((e) => logError(this.logger, e))

            return sharedExpenseTransaction
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    @Process(QueueProcessor.RECURRENT_PAYMENT_NOTIFICATION)
    async processNotification(job: Job<RecurrentPaymentNotificationJob>) {
        try {
            const expense = await this.sharedExpenseService.findSharedExpenseBy({ id: job.data.sharedExpenseId })

            if (!expense || !expense.isActive) {
                return
            }

            await this.expenseApiService.sendRecurringExpenseReminders(expense)
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    private async createSharedExpenseTransaction(
        sharedExpense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        amountOwed: Dinero.Dinero,
        totalFeeAmount: Dinero.Dinero
    ): Promise<SharedExpenseTransaction> {
        const sourceUser = await agreement.user
        const sourceAccount = await agreement.paymentAccount
        const destinationUser = await sharedExpense.user
        const destinationAccount = await sharedExpense.expenseOwnerDestinationAccount

        this.logger.log(
            `Creating recurring payment transaction database record for expense id ${sharedExpense.id} and agreement id ${agreement.id}`
        )

        const sharedExpenseTransaction = await this.sharedExpenseService.findOrCreateRecurringPaymentTransaction(
            sharedExpense,
            agreement,
            destinationUser,
            destinationAccount,
            sourceUser,
            sourceAccount,
            totalFeeAmount,
            amountOwed
        )

        return await this.expenseApiService.createTransferOfFunds(sharedExpense, agreement, sharedExpenseTransaction)
    }

    @OnQueueCompleted()
    async onCompleted(job: Job<RecurrentPaymentJob>) {
        this.logger.verbose(`OnQueueCompleted ${JSON.stringify(job.data)}`)
    }

    @OnQueueProgress()
    onProgress(job: Job<unknown>) {
        this.logger.verbose(`Job processed: ${JSON.stringify(job.data)}`)
    }

    @OnQueueActive()
    onActive(job: Job<unknown>) {
        this.logger.verbose(`Queue: ${Queues.RECURRENT_PAYMENTS} has become active with ${JSON.stringify(job)}`)
    }

    @OnQueueDrained()
    onDrained() {
        this.logger.verbose(
            `Queue: ${Queues.RECURRENT_PAYMENTS} has been drained (all outstanding jobs have been processed)`
        )
    }

    @OnQueueError()
    async onError(job: Job<RecurrentPaymentJob>, error: Error) {
        this.logger.error(`Queue: ${Queues.RECURRENT_PAYMENTS} error ${error.message}`)
    }
}
