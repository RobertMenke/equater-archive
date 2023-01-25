import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getRepositoryToken } from '@nestjs/typeorm'
import { faker } from '@faker-js/faker'
import { Repository } from 'typeorm'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { PLAID_TEST_ACCOUNT_WITH_ACH_ID } from '../test.constants'
import { AuthService } from '../user/auth.service'
import { PushNotificationService } from '../device/push-notification.service'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { EmailService } from '../email/email.service'
import { PlaidServiceFake } from '../plaid/plaid.service.fake'
import { PlaidMockService } from '../seeding/plaid-mock.service'
import { SeedingService } from '../seeding/seeding.service'
import {
    ExpenseContributionType,
    SharedExpenseUserAgreement
} from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpenseWithholdingReason } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { CommunicationGateway } from '../socket/communication.gateway'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, makeDinero } from '../utils/data.utils'
import { runAfter } from '../utils/test.utils'
import { ExpenseApiService } from './expense-api.service'
import { TransactionsUpdateEvent } from './events/transactions-update.event'
import { TransactionsUpdateHandler } from './transactions-update.handler'

//Note that since this is kicked off by the CQRS package's event bus these tests
//will be unit tests and not integration tests. Event bus publishes events asynchronously
//and therefore trying to do a normal e2e test would be problematic and likely include
//race conditions
describe('Transactions Update Handler', () => {
    //////////////////////////////////////
    // Services
    //////////////////////////////////////
    let app: NestExpressApplication
    let seedService: SeedingService
    let plaidMockService: PlaidMockService
    let authService: AuthService
    let userService: UserService
    let userAccountService: UserAccountService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let vendorService: VendorService
    let sharedExpenseService: SharedExpenseService
    let expenseApiService: ExpenseApiService
    let transactionsUpdateHandler: TransactionsUpdateHandler
    let pushService: PushNotificationService
    let emailService: EmailService

    //////////////////////////////////////
    // Properties
    //////////////////////////////////////
    let vendor: UniqueVendor
    let user: User
    let payee: User
    let userAccount: UserAccount
    let payeeAccount: UserAccount
    let sharedExpense: SharedExpense
    let sharedExpenseUserAgreements: SharedExpenseUserAgreement[]
    let authToken: string

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        plaidMockService = app.get<PlaidMockService>(PlaidMockService)
        authService = app.get<AuthService>(AuthService)
        userService = app.get<UserService>(UserService)
        userAccountService = app.get<UserAccountService>(UserAccountService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        vendorService = app.get<VendorService>(VendorService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        expenseApiService = app.get<ExpenseApiService>(ExpenseApiService)
        transactionsUpdateHandler = app.get<TransactionsUpdateHandler>(TransactionsUpdateHandler)
        pushService = app.get<PushNotificationService>(PushNotificationService)
        emailService = app.get<EmailService>(EmailService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        user = await seedService.seedVerifiedUser()
        payee = await seedService.seedUser()
        userAccount = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        payeeAccount = await seedService.seedUserAccount(payee)
        await seedService.seedHistoricalTransactionPull(user)
        vendor = (await vendorService.getUniqueVendors()).pop()
        sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
        sharedExpenseUserAgreements = await seedService.seedSharedExpenseUserAgreements(
            sharedExpense,
            1,
            ExpenseContributionType.SPLIT_EVENLY,
            BinaryStatus.IS_ACTIVE,
            [payee]
        )
        authToken = user.sessionToken
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    describe('Storing newly found transactions', () => {
        it('Should store newly found transactions', async () => {
            const amount = makeDinero(Math.ceil(Math.ceil(PlaidServiceFake.availableBalance / 2)))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            let transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            transactions = await transactionService.findManyTransactionsBy({ accountId: userAccount.id })
            const lastTransaction = transactions.pop()

            expect(lastTransaction.transactionId).toBe(transactionsResponse.transactions[0].transaction_id)
        })
        it('Should create new UniqueVendor records when new UniqueVendors are discovered', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                faker.company.name(),
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const newVendor = await vendorService.findUniqueVendorBy({
                friendlyName: transactionsResponse.transactions[0].name
            })

            expect(newVendor).not.toBeNull()
        })
        it('Should send a websocket notification to all parties when a new transaction is recorded', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const amount = makeDinero(Math.ceil(Math.ceil(PlaidServiceFake.availableBalance / 2)))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            let transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(2)
            })
        })
    })

    describe('Creating transactions for involved parties', () => {
        it("Should use the expense owner's account as the destination account and the payee's account as the source account for a transaction", async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction).not.toBeNull()
        })
        it('Should not create duplicate shared expense transaction records for a given transaction, payee, and expense owner', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transaction = await seedService.seedPlaidTransaction(
                userAccount,
                transactionsResponse.transactions[0],
                vendor
            )
            await seedService.seedSharedExpenseTransaction(
                payeeAccount,
                userAccount,
                sharedExpense,
                sharedExpenseUserAgreements[0],
                transaction,
                true
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findManyTransactionsBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction.length).toBe(1)
        })
        it('Should match a shared bill and charge involved parties when an associated unique vendor is detected when parsing transactions', async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(2),
                context.withTransactionHistory
            )

            const additionalVendor = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: 'Associated Vendor'
                })
            )

            context = await context.chain(
                () => context.withVendorAssociation(vendor, additionalVendor),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE, additionalVendor),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id,
                sharedExpenseId: sharedExpense.id
            })

            expect(sharedExpenseTransaction).not.toBeNull()
        })
        it('Should NOT match a shared bill and charge involved parties when a vendor association does not exist', async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(2),
                context.withTransactionHistory
            )

            const additionalVendor = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: 'Associated Vendor'
                })
            )

            context = await context.chain(
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE, additionalVendor),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id,
                sharedExpenseId: context.getSharedExpense().id
            })

            expect(sharedExpenseTransaction).toBeNull()
        })
        it('Should NOT charge a fee. Originally, the project was developed with the intent to charge a fee for transactions over $50.', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction.totalFeeAmount).toBe(0)
        })
        it('Should initiate a dwolla transfer between the parties involved', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction).not.toBeNull()
            expect(sharedExpenseTransaction.dwollaTransferUrl).not.toBeNull()
            expect(sharedExpenseTransaction.dwollaTransferId).not.toBeNull()
        })
        it('Should NOT (Dwolla already does this - revisit once we are off pay as you go) notify both the expense owner and the payee that the transaction was attempted', async () => {
            const spy = jest.spyOn(emailService, 'sendTransactionUpdate')
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const userDevice = await seedService.seedUserDevice(user)
            const payeeDevice = await seedService.seedUserDevice(payee)
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction.totalFeeAmount).toBe(0)

            const userNotifications = await pushService.findWhere({ deviceId: userDevice.id })
            const payeeNotifications = await pushService.findWhere({ deviceId: payeeDevice.id })

            expect(userNotifications.length).toBe(1)
            expect(payeeNotifications.length).toBe(1)
            expect(spy.mock.calls.length).toBe(0)
        })
        it('Should include the expense nickname in the push notifications for the payer and recipient', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const userDevice = await seedService.seedUserDevice(user)
            const payeeDevice = await seedService.seedUserDevice(payee)
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction.totalFeeAmount).toBe(0)

            const userNotifications = await pushService.findWhere({ deviceId: userDevice.id })
            const payeeNotifications = await pushService.findWhere({ deviceId: payeeDevice.id })

            expect(userNotifications[0].body.includes(sharedExpense.expenseNickName)).toBeTruthy()
            expect(payeeNotifications[0].body.includes(sharedExpense.expenseNickName)).toBeTruthy()
        })
        it('Should reverse the source and destination when the transaction is negative', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2) * -1)
            const availableBalance = amount.multiply(2, 'HALF_EVEN').multiply(-1)
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: userAccount.id,
                destinationAccountId: payeeAccount.id
            })

            expect(sharedExpenseTransaction).not.toBeNull()
        })
        it('Should be able to detect shared expenses that matched on the expense owners source account and then settle up using the expense owners destination account', async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')

            let expenseOwnerSourceAccount = await seedService.seedUserAccount(user)
            expenseOwnerSourceAccount.accountType = PlaidSupportedAccountType.CREDIT
            expenseOwnerSourceAccount.accountSubType = 'credit card'
            await userAccountService.save(expenseOwnerSourceAccount)

            sharedExpense.expenseOwnerSourceAccountId = expenseOwnerSourceAccount.id
            const sharedExpenseRepository = app.get<Repository<SharedExpense>>(getRepositoryToken(SharedExpense))
            await sharedExpenseRepository.save(sharedExpense)

            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                expenseOwnerSourceAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            expect(sharedExpenseTransaction).not.toBeNull()
        })
        it(`Should not create ${SharedExpenseTransaction.name}s for Plaid transactions with a pending transaction ID that has already been captured by a ${SharedExpenseTransaction.name}`, async () => {
            const amount = makeDinero(Math.ceil(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            let transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance,
                true
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            // First, handle the transaction in its pending state
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })
            expect(sharedExpenseTransaction).not.toBeNull()

            // Next, create a new version of the transaction that is not pending
            transactionsResponse = {
                ...transactionsResponse,
                transactions: [
                    {
                        ...transactionsResponse.transactions[0],
                        transaction_id: faker.random.alphaNumeric(10),
                        pending_transaction_id: transactionsResponse.transactions[0].transaction_id,
                        pending: false
                    }
                ]
            }

            const nextTransactionBatch = await transactionPullService.storeTransactions(
                user,
                userAccount,
                transactionsResponse
            )

            const postedTransactionEvent = new TransactionsUpdateEvent(user, userAccount, nextTransactionBatch)
            await transactionsUpdateHandler.handle(postedTransactionEvent)

            const allTransactions = await sharedExpenseService.findManyTransactionsBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })
            expect(allTransactions.length).toBe(1)
            expect(allTransactions[0].id).toBe(sharedExpenseTransaction.id)
        })
    })

    describe('Calculating the amount of money that should be contributed by each party', () => {
        it('Should perform a 50/50 split evenly between 2 parties', async () => {
            PlaidServiceFake.availableBalance = 1000000
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            const expectedAmount = amount.divide(2, 'HALF_EVEN')
            expect(sharedExpenseTransaction.totalTransactionAmount).toBe(expectedAmount.getAmount())
        })
        it('Should round to the nearest cent when the contribution amount is a repeating decimal', async () => {
            PlaidServiceFake.availableBalance = 1000000000
            let context = TestingContext.fromApp(app)
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(2),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                context.getUserAccount().accountId,
                context.getUniqueVendor().friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(
                user,
                context.getUserAccount(),
                transactionsResponse
            )
            const event = new TransactionsUpdateEvent(context.getUser(), context.getUserAccount(), transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUserAccounts().pop().id,
                destinationAccountId: context.getUserAccount().id
            })

            const expectedAmount = amount.divide(3, 'HALF_EVEN')
            expect(sharedExpenseTransaction.totalTransactionAmount).toBe(expectedAmount.getAmount())
        })
        it('Should charge a fixed amount when the agreement type is set to ExpenseContributionType.FIXED', async () => {
            PlaidServiceFake.availableBalance = 1000000000
            let context = TestingContext.fromApp(app)
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(1),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE, ExpenseContributionType.FIXED)
            )
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                context.getUserAccount().accountId,
                context.getUniqueVendor().friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(
                user,
                context.getUserAccount(),
                transactionsResponse
            )
            const event = new TransactionsUpdateEvent(context.getUser(), context.getUserAccount(), transactions)
            await transactionsUpdateHandler.handle(event)
            const payeeAccount = context.getSecondaryUserAccounts().pop()
            const payeeUserAgreement = context.getSharedExpenseUserAgreements().pop()
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: context.getUserAccount().id
            })

            const expectedAmount = payeeUserAgreement.contributionValue
            expect(sharedExpenseTransaction.totalTransactionAmount).toBe(expectedAmount)
        })
        it('Should charge a percentage amount when the agreement type is set to ExpenseContributionType.PERCENTAGE', async () => {
            PlaidServiceFake.availableBalance = 1000000000
            let context = TestingContext.fromApp(app)
            // Use 3 payees so that it should be a 25% split all around
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(3),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
                () =>
                    context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE, ExpenseContributionType.PERCENTAGE)
            )
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                context.getUserAccount().accountId,
                context.getUniqueVendor().friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(
                user,
                context.getUserAccount(),
                transactionsResponse
            )
            const event = new TransactionsUpdateEvent(context.getUser(), context.getUserAccount(), transactions)
            await transactionsUpdateHandler.handle(event)
            const payeeAccount = context.getSecondaryUserAccounts().pop()
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: context.getUserAccount().id
            })

            const expectedAmount = amount.percentage(25)
            expect(sharedExpenseTransaction.totalTransactionAmount).toBe(expectedAmount.getAmount())
        })
        it('Should charge a fee for a transaction', async () => {
            PlaidServiceFake.availableBalance = 1000000
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })
            expect(sharedExpenseTransaction.totalFeeAmount).toBe(0)
        })
        it('Should not charge a fee if the transaction amount is less than 2x the amount of the fee', async () => {
            PlaidServiceFake.availableBalance = 1000000
            const amount = makeDinero(290)
            const availableBalance = amount.multiply(10000, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })
            expect(sharedExpenseTransaction.totalFeeAmount).toBe(0)
        })
    })

    describe('Recording Withheld Transactions', () => {
        it('Should create a withheld transaction when the payee has insufficient funds', async () => {
            const amount = makeDinero(PlaidServiceFake.availableBalance * 3)
            const availableBalance = amount.subtract(makeDinero(1))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const withheldExpense = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpense.length).toBe(1)
            expect(sharedExpenseTransactions.length).toBe(1)
            expect(withheldExpense[0].withholdingReason).toBe(SharedExpenseWithholdingReason.INSUFFICIENT_FUNDS)
        })
        it('Should create a withheld transaction when dwolla responds with a 400', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
            const amount = makeDinero(Math.floor(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.add(makeDinero(amount.getAmount()))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const withheldExpense = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpense.length).toBe(1)
            expect(sharedExpenseTransactions.length).toBe(1)
            expect(withheldExpense[0].withholdingReason).toBe(SharedExpenseWithholdingReason.INVALID_FUNDING_SOURCE)
        })
        it('Should create a withheld transaction when dwolla responds with a 401', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.UNAUTHORIZED
            const amount = makeDinero(Math.floor(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.add(makeDinero(amount.getAmount()))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const withheldExpense = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpense.length).toBe(1)
            expect(sharedExpenseTransactions.length).toBe(1)
            expect(withheldExpense[0].withholdingReason).toBe(SharedExpenseWithholdingReason.INVALID_ACCESS_TOKEN)
        })
        it('Should create a withheld transaction when dwolla responds with a 403', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.FORBIDDEN
            const amount = makeDinero(Math.floor(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.add(makeDinero(amount.getAmount()))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const withheldExpense = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpense.length).toBe(1)
            expect(sharedExpenseTransactions.length).toBe(1)
            expect(withheldExpense[0].withholdingReason).toBe(SharedExpenseWithholdingReason.FORBIDDEN)
        })
        it('Should create a withheld transaction with reason SharedExpenseWithholdingReason.UNKNOWN when dwolla responds with a 500', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.INTERNAL_SERVER_ERROR
            const amount = makeDinero(Math.floor(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.add(makeDinero(amount.getAmount()))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const withheldExpense = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpense.length).toBe(1)
            expect(sharedExpenseTransactions.length).toBe(1)
            expect(withheldExpense[0].withholdingReason).toBe(SharedExpenseWithholdingReason.UNKNOWN)
        })
        it('Should mark all withheld transactions as reconciled when a transaction is processed', async () => {
            // First create 2 transaction attempts that get marked as withheld
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
            const amount = makeDinero(Math.floor(PlaidServiceFake.availableBalance / 2))
            const availableBalance = amount.add(makeDinero(amount.getAmount()))
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            await transactionsUpdateHandler.handle(event)

            let withheldExpenses = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            let sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpenses.length).toBe(2)
            expect(sharedExpenseTransactions.length).toBe(1)
            withheldExpenses.forEach((expense) => {
                expect(expense.hasBeenReconciled).toBe(false)
            })

            // Now, create a valid transaction and verify that all withheld transactions have been marked as reconciled
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.CREATED
            await transactionsUpdateHandler.handle(event)
            withheldExpenses = await sharedExpenseService.findManyWithheldTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })
            sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
                sharedExpenseUserAgreementId: sharedExpenseUserAgreements[0].id
            })

            expect(withheldExpenses.length).toBe(2)
            expect(sharedExpenseTransactions.length).toBe(1)
            withheldExpenses.forEach((expense) => {
                expect(expense.hasBeenReconciled).toBe(true)
                expect(expense.dateTimeReconciled).not.toBeNull()
            })
            sharedExpenseTransactions.forEach((transaction) => {
                expect(transaction.dwollaTransferUrl).not.toBeNull()
            })
        })
    })

    describe('Handling Plaid errors', () => {
        it('Should mark a user as requiring re-authentication with plaid when plaid throws an error with error code ITEM_LOGIN_REQUIRED', async () => {
            PlaidServiceFake.availableBalance = 1000000
            PlaidServiceFake.shouldThrowAuthError = true
            const amount = makeDinero(10000)
            const availableBalance = amount.multiply(2, 'HALF_EVEN')
            const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
                userAccount.accountId,
                vendor.friendlyName,
                amount,
                availableBalance
            )
            const transactions = await transactionPullService.storeTransactions(user, userAccount, transactionsResponse)
            const event = new TransactionsUpdateEvent(user, userAccount, transactions)
            await transactionsUpdateHandler.handle(event)
            const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: payeeAccount.id,
                destinationAccountId: userAccount.id
            })

            const expectedAmount = amount.divide(2, 'HALF_EVEN')
            expect(sharedExpenseTransaction.totalTransactionAmount).toBe(expectedAmount.getAmount())

            await runAfter(1000, async () => {
                const updatedAccount = await userAccountService.findOneWhere({ id: payeeAccount.id })
                expect(updatedAccount.requiresPlaidReAuthentication).toBeTruthy()
            })
        })
    })
})
