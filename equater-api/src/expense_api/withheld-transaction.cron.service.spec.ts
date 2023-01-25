import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { subDays } from 'date-fns'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { PlaidServiceFake } from '../plaid/plaid.service.fake'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { MAXIMUM_TRANSACTION_ATTEMPTS } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { CommunicationGateway } from '../socket/communication.gateway'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, repeatAsync } from '../utils/data.utils'
import { runAfter } from '../utils/test.utils'
import { ExpenseApiService } from './expense-api.service'
import { WithheldTransactionCronService } from './withheld-transaction.cron.service'

describe('Withheld Transaction Cron Service', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let processor: WithheldTransactionCronService
    let sharedExpenseService: SharedExpenseService
    let expenseApiService: ExpenseApiService
    let context: TestingContext

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        processor = app.get<WithheldTransactionCronService>(WithheldTransactionCronService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        expenseApiService = app.get<ExpenseApiService>(ExpenseApiService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        context = TestingContext.fromApp(app)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    it('Should only process withheld transactions that are > 24 hours old', async () => {
        context = await context.withWithheldTransaction(new Date())
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(0)
    })
    it('Should settle a transaction when dwolla responds successfully', async () => {
        PlaidServiceFake.availableBalance = 100000000
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(1)
        const withheldTransaction = await sharedExpenseService.findWithheldTransactionBy({
            id: context.getWithheldTransactions()[0].id
        })
        expect(withheldTransaction.hasBeenReconciled).toBeTruthy()
    })
    it('Should settle a transaction when the original agreement is deactivated', async () => {
        PlaidServiceFake.availableBalance = 100000000
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        const sharedExpense = context.getSharedExpense()
        await sharedExpenseService.setSharedExpenseStatus(sharedExpense, BinaryStatus.IS_INACTIVE)
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(0)
        const withheldTransaction = await sharedExpenseService.findWithheldTransactionBy({
            id: context.getWithheldTransactions()[0].id
        })
        expect(withheldTransaction.hasBeenReconciled).toBeTruthy()
    })
    it('Should increment the transfer attempts when dwolla responds with an error', async () => {
        DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(1)
        const withheldTransaction = await sharedExpenseService.findWithheldTransactionBy({
            id: context.getWithheldTransactions()[0].id
        })
        const transaction = await sharedExpenseService.findTransactionBy({
            id: context.getSharedExpenseTransactions()[0].id
        })
        expect(withheldTransaction.hasBeenReconciled).toBeFalsy()
        expect(transaction.numberOfTimesAttempted).toBe(
            context.getSharedExpenseTransactions()[0].numberOfTimesAttempted + 1
        )
    })
    it(`Should only process a withheld transaction ${MAXIMUM_TRANSACTION_ATTEMPTS} before giving up`, async () => {
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        const transaction = context.getSharedExpenseTransactions()[0]
        await repeatAsync(MAXIMUM_TRANSACTION_ATTEMPTS, async () => {
            await sharedExpenseService.incrementTransactionAttempts(transaction)
        })
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(0)
    })
    it('Should send out notifications based on the status of the attempt', async () => {
        const sourceSpy = jest.spyOn(expenseApiService, 'notifyPayeeOfTransactionAttempt')
        const destinationSpy = jest.spyOn(expenseApiService, 'notifyExpenseOwnerOfTransactionAttempt')
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        const transactionsProcessed = await processor.processWithheldTransactions()
        expect(transactionsProcessed.length).toBe(1)
        expect(sourceSpy.mock.calls.length).toBe(1)
        expect(destinationSpy.mock.calls.length).toBe(1)
    })
    it('Should send a websocket notification when a withheld transaction is updated', async () => {
        const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
        const spy = jest.spyOn(socketGateway, 'sendMessage')
        context = await context.withWithheldTransaction(subDays(new Date(), 2))
        await processor.processWithheldTransactions()
        await runAfter(1000, () => {
            expect(spy.mock.calls.length).toBe(2)
        })
    })
    it('Should mark a user as requiring re-authentication with plaid when plaid throws an error with error code ITEM_LOGIN_REQUIRED', async () => {
        PlaidServiceFake.availableBalance = 100000000
        context = await context.withWithheldTransaction(subDays(new Date(), 2))

        try {
            PlaidServiceFake.shouldThrowAuthError = true
            await processor.processWithheldTransactions()
        } catch (e) {}

        app.get<UserService>(UserService)
        await runAfter(1000, async () => {
            const accountService = app.get<UserAccountService>(UserAccountService)
            const updatedAccount = await accountService.findOneWhere({ id: context.getSecondaryUserAccounts()[0].id })
            expect(updatedAccount.requiresPlaidReAuthentication).toBeTruthy()
        })
    })
})
