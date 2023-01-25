import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { Queue } from 'bull'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { QueueProcessor, Queues } from '../config/config.service'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { flatMapAsync, mapAsync } from '../utils/data.utils'
import { ONE_HOUR } from '../utils/date.utils'
import { RECURRING_PAYMENT_REMINDER_HOUR, RECURRING_PAYMENT_SETTLEMENT_HOUR } from './expense-api.constants'
import { RecurrentPaymentJob, RecurrentPaymentNotificationJob } from './recurrent-payment.job'

@Injectable()
export class RecurrentPaymentCronService {
    private readonly logger = new Logger(RecurrentPaymentCronService.name)

    constructor(
        @InjectQueue(Queues.RECURRENT_PAYMENTS)
        private readonly queue: Queue,
        private readonly sharedExpenseService: SharedExpenseService
    ) {}

    // Since multiple servers could be creating jobs at once and we're avoiding duplicate work
    // with @nestjs/bull only look up shared expenses and agreements for jobs and let the actual
    // processor create the transactions
    @Cron(`0 ${RECURRING_PAYMENT_SETTLEMENT_HOUR} * * *`)
    async queueRecurrentPayments() {
        this.logger.log(`Queueing recurring payments for processing -- current time ${new Date().toString()}`)
        const expenses = await this.sharedExpenseService.findRecurringPaymentsThatShouldBeSettled()
        const jobs = await flatMapAsync(expenses, (expense) => this.createRecurrentPaymentJobs(expense))

        // Returning jobs here only for testing purposes
        const numberOfJobs = await mapAsync(jobs, (job) =>
            this.queue.add(QueueProcessor.RECURRENT_PAYMENT, instanceToPlain(job, { excludePrefixes: ['__'] }), {
                jobId: `${QueueProcessor.RECURRENT_PAYMENT}-${job.uuid}`,
                attempts: 2,
                backoff: ONE_HOUR
            })
        )

        this.logger.log(`Queued ${numberOfJobs.length} recurring payments for processing`)
        return numberOfJobs
    }

    @Cron(`0 ${RECURRING_PAYMENT_REMINDER_HOUR} * * *`)
    async sendRemindersDayBefore() {
        this.logger.log(
            `Sending notifications for recurring expenses happening tomorrow -- current time ${new Date().toString()}`
        )
        const expenses = await this.sharedExpenseService.findRecurringExpensesThatWillBeSettledTomorrow()
        const jobs = this.createPaymentNotificationJobs(expenses)
        // Returning jobs here only for testing purposes
        const numberOfJobs = await mapAsync(jobs, (job) =>
            this.queue.add(
                QueueProcessor.RECURRENT_PAYMENT_NOTIFICATION,
                instanceToPlain(job, { excludePrefixes: ['__'] }),
                {
                    jobId: `${QueueProcessor.RECURRENT_PAYMENT_NOTIFICATION}-${job.uuid}`,
                    attempts: 1
                }
            )
        )

        this.logger.log(`Queued ${numberOfJobs.length} recurring payments for processing`)
        return numberOfJobs
    }

    private async createRecurrentPaymentJobs(expense: SharedExpense): Promise<RecurrentPaymentJob[]> {
        const agreements = await this.sharedExpenseService.findManyAgreementsBy({
            sharedExpenseId: expense.id,
            isActive: true
        })

        return agreements.map((agreement) =>
            plainToClass(RecurrentPaymentJob, {
                sharedExpenseId: expense.id,
                sharedExpenseUserAgreementId: agreement.id,
                uuid: agreement.uuid
            })
        )
    }

    private createPaymentNotificationJobs(list: SharedExpense[]): RecurrentPaymentNotificationJob[] {
        return list.map((item) =>
            plainToClass(RecurrentPaymentNotificationJob, {
                sharedExpenseId: item.id,
                uuid: item.uuid
            })
        )
    }
}
