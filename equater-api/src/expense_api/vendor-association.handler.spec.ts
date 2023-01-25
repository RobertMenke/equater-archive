import { NestExpressApplication } from '@nestjs/platform-express'
import { getRepositoryToken } from '@nestjs/typeorm'
import { subDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import { Repository } from 'typeorm'
import { PlaidMockService } from '../seeding/plaid-mock.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { BinaryStatus, makeDinero } from '../utils/data.utils'
import { VendorAssociationEvent } from './events/vendor-association.event'
import { VendorAssociationHandler } from './vendor-association.handler'

describe(VendorAssociationHandler.name, () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let context: TestingContext
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let sharedExpenseService: SharedExpenseService
    let vendorAssociationHandler: VendorAssociationHandler
    let plaidMockService: PlaidMockService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        vendorAssociationHandler = app.get<VendorAssociationHandler>(VendorAssociationHandler)
        plaidMockService = app.get<PlaidMockService>(PlaidMockService)
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

    async function createAssociatedVendor(vendorOne: UniqueVendor) {
        const vendorTwo = await seedService.seedVendor(
            new UniqueVendor({
                friendlyName: faker.company.name()
            })
        )

        return {
            associatedVendor: vendorTwo,
            association: await seedService.seedVendorAssociation(vendorOne, vendorTwo)
        }
    }

    it('Should find and settle transactions for shared bills charged by a parent company', async () => {
        await context.withTransactionHistory()
        const { associatedVendor, association } = await createAssociatedVendor(context.getUniqueVendor())
        context = await context.chain(
            context.withPayee,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE, associatedVendor),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
        )

        const event = new VendorAssociationEvent(association, context.getUniqueVendor(), associatedVendor)
        await vendorAssociationHandler.handle(event)

        const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
            sharedExpenseId: context.getSharedExpense().id
        })

        expect(sharedExpenseTransactions.length).toBeGreaterThan(0)
    })
    it('Should not create duplicate transactions in the case that a shared bill has already been settled', async () => {
        await context.withTransactionHistory()
        const { associatedVendor, association } = await createAssociatedVendor(context.getUniqueVendor())
        context = await context.chain(
            context.withPayee,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE, associatedVendor),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
        )
        const transactionVendor = await context.getUniqueVendor()
        const transaction = (await transactionVendor.transactions)[0]
        // Simulate the case where a transaction has already been processed
        await seedService.seedSharedExpenseTransaction(
            context.getUserAccount(),
            context.getSecondaryUserAccounts()[0],
            context.getSharedExpense(),
            context.getSharedExpenseUserAgreements()[0],
            transaction,
            true
        )

        let sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
            sharedExpenseId: context.getSharedExpense().id
        })

        expect(sharedExpenseTransactions.length).toBe(1)

        const event = new VendorAssociationEvent(association, context.getUniqueVendor(), associatedVendor)
        await vendorAssociationHandler.handle(event)

        sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
            sharedExpenseId: context.getSharedExpense().id
        })

        expect(sharedExpenseTransactions.length).toBe(1)
    }, 20_000)
    it('Should find and settle transactions for shared bills charged by a subsidiary', async () => {
        await context.withTransactionHistory()
        const { associatedVendor, association } = await createAssociatedVendor(context.getUniqueVendor())

        context = await context.chain(
            context.withPayee,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
        )

        // Create a transaction for the parent company so that we can confirm the
        // user agreement for the subsidiary gets charged
        // TODO: Probably should only create associated transaction in the case that the
        // TODO: agreement is for a subsidiary and the parent company issues a charge.
        // TODO: The other direction opens us up to some potentially odd behavior
        const transactionsResponse = plaidMockService.mockPlaidTransactionsResponse(
            context.getUserAccount().accountId,
            associatedVendor.friendlyName,
            makeDinero(1000),
            makeDinero(10000)
        )
        await seedService.seedPlaidTransaction(
            context.getUserAccount(),
            transactionsResponse.transactions[0],
            associatedVendor
        )

        const event = new VendorAssociationEvent(association, context.getUniqueVendor(), associatedVendor)
        await vendorAssociationHandler.handle(event)

        const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
            sharedExpenseId: context.getSharedExpense().id
        })

        expect(sharedExpenseTransactions.length).toBeGreaterThan(0)
    })
    it(`Should NOT try to settle transactions that occurred greater than ${VendorAssociationHandler.TRANSACTION_LOOK_BACK_CUTOFF_IN_DAYS} days ago`, async () => {
        await context.withTransactionHistory()
        const { associatedVendor, association } = await createAssociatedVendor(context.getUniqueVendor())
        context = await context.chain(
            context.withPayee,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE, associatedVendor),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
        )

        const transaction = (await context.getUniqueVendor().transactions)[0]
        const transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction))
        transaction.dateTimeCaptured = subDays(new Date(), 31)
        await transactionRepository.save(transaction)

        const event = new VendorAssociationEvent(association, context.getUniqueVendor(), associatedVendor)
        await vendorAssociationHandler.handle(event)

        const sharedExpenseTransactions = await sharedExpenseService.findManyTransactionsBy({
            sharedExpenseId: context.getSharedExpense().id
        })

        expect(sharedExpenseTransactions.length).toBe(0)
    })
})
