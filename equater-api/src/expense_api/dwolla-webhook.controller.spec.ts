import { HttpStatus } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DwollaWebhookPayload } from '../dwolla/dwolla-webhook-payload.dto'
import { DwollaWebhookEvent } from '../dwolla/dwolla-webhook.event'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { DwollaTransferStatus } from '../dwolla/dwolla.types'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseTransactionLog } from '../shared_expense/shared-expense-transaction-log.entity'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { UserService } from '../user/user.service'
import { BinaryStatus } from '../utils/data.utils'
import { TransferStatusService } from './transfer-status.service'
import * as supertest from 'supertest'
import { v4 as uuid } from 'uuid'

describe('DwollaWebHookController', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let processor: TransferStatusService
    let sharedExpenseService: SharedExpenseService
    let context: TestingContext

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        processor = app.get<TransferStatusService>(TransferStatusService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        context = TestingContext.fromApp(app)
        context = await context.chain(
            context.withUser,
            context.withPayee,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE),
            () => context.withSharedExpenseTransaction(false)
        )
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    async function createPayload(
        transaction: SharedExpenseTransaction,
        event: DwollaWebhookEvent,
        eventId: string = uuid()
    ): Promise<DwollaWebhookPayload> {
        const now = new Date()
        const payeeAccount = await transaction.sourceAccount
        const user = await payeeAccount.user

        return {
            id: eventId,
            resourceId: transaction.dwollaTransferId,
            topic: event,
            _links: {
                self: {
                    href: `https://api-sandbox.dwolla.com/events/${eventId}`,
                    'resource-type': 'event',
                    type: 'application/vnd.dwolla.v1.hal+json'
                },
                account: {
                    href: `https://api-sandbox.dwolla.com/accounts/${payeeAccount.dwollaFundingSourceId}`,
                    'resource-type': 'account',
                    type: 'application/vnd.dwolla.v1.hal+json'
                },
                resource: {
                    href: `https://api-sandbox.dwolla.com/transactions/${transaction.uuid}`,
                    'resource-type': 'transaction',
                    type: 'application/vnd.dwolla.v1.hal+json'
                },
                customer: {
                    href: `https://api-sandbox.dwolla.com/customers/${user.dwollaCustomerId}`,
                    'resource-type': 'customer',
                    type: 'application/vnd.dwolla.v1.hal+json'
                }
            },
            created: now.toISOString()
        }
    }

    describe('POST /api/dwolla/webhook', () => {
        it('Should update a transfer when it has completed', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PROCESSED
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_TRANSFER_COMPLETED
            const payload = await createPayload(transaction, event)
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.PROCESSED)
            const log = await sharedExpenseService.findTransactionEventLogBy({
                uuid: payload.id
            })
            expect(log).toBeInstanceOf(SharedExpenseTransactionLog)
        })
        it('Should update a transfer when it has failed', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.FAILED
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_TRANSFER_COMPLETED
            const payload = await createPayload(transaction, event)
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.FAILED)
            const log = await sharedExpenseService.findTransactionEventLogBy({
                uuid: payload.id
            })
            expect(log).toBeInstanceOf(SharedExpenseTransactionLog)
        })
        it('Should create a log of a bank transfer being created', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PENDING
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_CREATED
            const payload = await createPayload(transaction, event)
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.PENDING)
            const log = await sharedExpenseService.findTransactionEventLogBy({
                uuid: payload.id
            })
            expect(log).toBeInstanceOf(SharedExpenseTransactionLog)
            expect(log.event).toBe(DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_CREATED)
        })
        it('Should create a log of a bank transfer being completed', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PENDING
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_COMPLETED
            const payload = await createPayload(transaction, event)
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.PENDING)
            const log = await sharedExpenseService.findTransactionEventLogBy({
                uuid: payload.id
            })
            expect(log).toBeInstanceOf(SharedExpenseTransactionLog)
            expect(log.event).toBe(DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_COMPLETED)
        })
        it('Should create a log of a bank transfer failing', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PENDING
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_FAILED
            const payload = await createPayload(transaction, event)
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.PENDING)
            const log = await sharedExpenseService.findTransactionEventLogBy({
                uuid: payload.id
            })
            expect(log).toBeInstanceOf(SharedExpenseTransactionLog)
            expect(log.event).toBe(DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_FAILED)
        })
        it('Should be idempotent when updating the completed status of a transaction', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PROCESSED
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_TRANSFER_COMPLETED
            const payload = await createPayload(transaction, event)

            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })

            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const transactionAfterSecondSimilarEvent = await sharedExpenseService.findTransactionBy({
                id: transaction.id
            })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.PROCESSED)
            const logs = await sharedExpenseService.findTransactionsEventLogsBy({
                uuid: payload.id
            })
            expect(logs.length).toBe(1)

            // idempotency test
            expect(updatedTransaction.dateTimeDwollaStatusUpdated.getTime()).toBe(
                transactionAfterSecondSimilarEvent.dateTimeDwollaStatusUpdated.getTime()
            )
        })
        it('Should be idempotent when updating the failure status of a transaction', async () => {
            DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.FAILED
            const transaction = context.getSharedExpenseTransactions()[0]
            const event = DwollaWebhookEvent.CUSTOMER_TRANSFER_FAILED
            const payload = await createPayload(transaction, event)

            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const updatedTransaction = await sharedExpenseService.findTransactionBy({ id: transaction.id })

            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(payload)
                .set(`x-dwolla-topic`, event)
                .expect(HttpStatus.CREATED)

            const transactionAfterSecondSimilarEvent = await sharedExpenseService.findTransactionBy({
                id: transaction.id
            })
            expect(updatedTransaction.dwollaStatus).toBe(DwollaTransferStatus.FAILED)
            const logs = await sharedExpenseService.findTransactionsEventLogsBy({
                uuid: payload.id
            })
            expect(logs.length).toBe(1)

            // idempotency test
            expect(updatedTransaction.dateTimeDwollaStatusUpdated.getTime()).toBe(
                transactionAfterSecondSimilarEvent.dateTimeDwollaStatusUpdated.getTime()
            )
        })
        it(`Should make user's re-verify their identity when we receive ${DwollaWebhookEvent.CUSTOMER_REVERIFICATION_NEEDED}`, async () => {
            const eventBus = jest.spyOn(app.get<EventBus>(EventBus), 'publish')
            const eventId = uuid()
            const reverificationPayload = {
                id: eventId,
                resourceId: context.getUser().dwollaCustomerId,
                topic: DwollaWebhookEvent.CUSTOMER_REVERIFICATION_NEEDED,
                timestamp: new Date().toISOString(),
                _links: {
                    self: { href: `https://api.dwolla.com/events/${eventId}` },
                    account: {
                        href: `https://api.dwolla.com/accounts/${context.getUserAccount().dwollaFundingSourceId}`
                    },
                    resource: { href: `https://api.dwolla.com/customers/${context.getUser().dwollaCustomerId}` },
                    customer: { href: `https://api.dwolla.com/customers/${context.getUser().dwollaCustomerId}` }
                },
                created: new Date().toISOString()
            }
            await supertest(app.getHttpServer())
                .post(`/api/dwolla/webhook`)
                .send(reverificationPayload)
                .set(`x-dwolla-topic`, DwollaWebhookEvent.CUSTOMER_REVERIFICATION_NEEDED)
                .expect(HttpStatus.CREATED)

            const userService = app.get<UserService>(UserService)
            const updatedUser = await userService.findOneWhere({ id: context.getUser().id })
            expect(updatedUser.dwollaReverificationNeeded).toBeTruthy()
            expect(eventBus.mock.calls.length).toBe(1)
        })
    })
})
