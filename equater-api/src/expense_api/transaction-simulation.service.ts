import { InjectQueue } from '@nestjs/bull'
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { Queue } from 'bull'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { format } from 'date-fns'
import {
    AccountSubtype,
    AccountType,
    TransactionCode,
    TransactionPaymentChannelEnum,
    TransactionsGetResponse
} from 'plaid'
import { v4 as uuid } from 'uuid'
import { ConfigService, QueueProcessor, Queues } from '../config/config.service'
import { SharedExpense, SharedExpenseType } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { UserAccountService } from '../user_account/user-account.service'
import { mapAsync } from '../utils/data.utils'
import { TransactionsUpdateEvent } from './events/transactions-update.event'
import { SimulatedArbitraryTransactionDto } from './expense-api.dto'
import { RecurrentPaymentJob } from './recurrent-payment.job'

@Injectable()
export class TransactionSimulationService {
    private readonly logger = new Logger(TransactionSimulationService.name)

    constructor(
        private readonly configService: ConfigService,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly userAccountService: UserAccountService,
        private readonly bus: EventBus,
        private readonly transactionPullService: TransactionPullService,
        @InjectQueue(Queues.RECURRENT_PAYMENTS)
        private readonly queue: Queue
    ) {}

    async simulateTransaction(sharedExpense: SharedExpense, amount: number | null) {
        if (sharedExpense.sharedExpenseType === SharedExpenseType.SHARED_BILL && amount) {
            await this.simulateVendorTransaction(sharedExpense, amount)
        }

        if (sharedExpense.sharedExpenseType === SharedExpenseType.RECURRING_PAYMENT) {
            await this.simulateRecurringTransaction(sharedExpense)
        }
    }

    async simulateArbitraryTransaction(dto: SimulatedArbitraryTransactionDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.accountId })

        if (!account) {
            throw new HttpException(`Invalid account ID supplied to transaction simulation`, HttpStatus.BAD_REQUEST)
        }

        const user = await account.user
        const fakedResponse: TransactionsGetResponse = {
            request_id: uuid(),
            total_transactions: 1,
            item: null,
            transactions: [
                {
                    authorized_datetime: null,
                    check_number: null,
                    datetime: null,
                    original_description: null,
                    personal_finance_category: null,
                    account_id: account.accountId,
                    account_owner: null,
                    amount: dto.amount,
                    iso_currency_code: 'US',
                    unofficial_currency_code: 'US',
                    category: ['simulated'],
                    category_id: uuid(),
                    date: format(new Date(), 'yyyy-MM-dd'),
                    location: {
                        address: null,
                        city: null,
                        country: null,
                        lat: null,
                        lon: null,
                        postal_code: null,
                        region: null,
                        store_number: null
                    },
                    merchant_name: dto.merchantName,
                    name: dto.transactionName,
                    payment_meta: {
                        by_order_of: null,
                        payee: null,
                        payer: null,
                        payment_method: null,
                        payment_processor: null,
                        ppd_id: dto.ppdId,
                        reason: null,
                        reference_number: null
                    },
                    pending: false,
                    pending_transaction_id: uuid(),
                    authorized_date: new Date().toISOString(),
                    payment_channel: TransactionPaymentChannelEnum.Other,
                    transaction_id: uuid(),
                    transaction_type: null,
                    transaction_code: TransactionCode.Purchase
                }
            ],
            accounts: [
                {
                    account_id: account.accountId,
                    mask: account.accountMask,
                    name: account.accountName,
                    official_name: account.accountName,
                    subtype: account.accountSubType as AccountSubtype,
                    type: account.accountType as AccountType,
                    verification_status: null,
                    balances: {
                        available: null,
                        current: null,
                        limit: null,
                        iso_currency_code: null,
                        unofficial_currency_code: null
                    }
                }
            ]
        }
        const transactions = await this.transactionPullService.storeTransactions(user, account, fakedResponse)
        this.bus.publish(new TransactionsUpdateEvent(user, account, transactions))
    }

    /**
     * @param sharedExpense
     * @param amount
     */
    private async simulateVendorTransaction(sharedExpense: SharedExpense, amount: number) {
        const user = await sharedExpense.user
        const account = await sharedExpense.expenseOwnerSourceAccount
        const vendor = await sharedExpense.uniqueVendor
        const fakedResponse: TransactionsGetResponse = {
            request_id: uuid(),
            total_transactions: 1,
            item: null,
            transactions: [
                {
                    authorized_datetime: null,
                    check_number: null,
                    datetime: null,
                    original_description: null,
                    personal_finance_category: null,
                    account_id: account.accountId,
                    account_owner: null,
                    amount: amount,
                    iso_currency_code: 'US',
                    unofficial_currency_code: 'US',
                    category: ['simulated'],
                    category_id: uuid(),
                    date: format(new Date(), 'yyyy-MM-dd'),
                    location: {
                        address: null,
                        city: null,
                        country: null,
                        lat: null,
                        lon: null,
                        postal_code: null,
                        region: null,
                        store_number: null
                    },
                    merchant_name: vendor.friendlyName,
                    name: vendor.friendlyName,
                    payment_meta: {
                        by_order_of: null,
                        payee: null,
                        payer: null,
                        payment_method: null,
                        payment_processor: null,
                        ppd_id: vendor.ppdId,
                        reason: null,
                        reference_number: null
                    },
                    pending: false,
                    pending_transaction_id: uuid(),
                    authorized_date: new Date().toISOString(),
                    payment_channel: TransactionPaymentChannelEnum.Other,
                    transaction_id: uuid(),
                    transaction_type: null,
                    transaction_code: TransactionCode.Purchase
                }
            ],
            accounts: [
                {
                    account_id: account.accountId,
                    mask: account.accountMask,
                    name: account.accountName,
                    official_name: account.accountName,
                    subtype: account.accountSubType as AccountSubtype,
                    type: account.accountType as AccountType,
                    verification_status: null,
                    balances: {
                        available: null,
                        current: null,
                        limit: null,
                        iso_currency_code: null,
                        unofficial_currency_code: null
                    }
                }
            ]
        }
        const transactions = await this.transactionPullService.storeTransactions(user, account, fakedResponse)
        this.bus.publish(new TransactionsUpdateEvent(user, account, transactions))
    }

    private async simulateRecurringTransaction(sharedExpense: SharedExpense) {
        const jobs = await this.createRecurrentPaymentJobs(sharedExpense)
        const serializedJobs = jobs.map((job) => instanceToPlain(job, { excludePrefixes: ['__'] }))

        const jobsSubmittedForProcessing = await mapAsync(serializedJobs, (job) =>
            this.queue.add(QueueProcessor.RECURRENT_PAYMENT, job, {
                jobId: `${QueueProcessor.RECURRENT_PAYMENT}-${job.uuid}`
            })
        )

        this.logger.log(`Simulating ${jobsSubmittedForProcessing.length} recurring agreements for processing`)
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
}
