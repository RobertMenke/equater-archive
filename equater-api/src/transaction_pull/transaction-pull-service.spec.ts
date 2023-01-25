import { NestExpressApplication } from '@nestjs/platform-express'
import { format } from 'date-fns'
import { faker } from '@faker-js/faker'
import {
    AccountSubtype,
    AccountType,
    ItemUpdateTypeEnum,
    TransactionPaymentChannelEnum,
    TransactionsGetResponse,
    TransactionTransactionTypeEnum
} from 'plaid'
import { v4 as uuid } from 'uuid'
import { PLAID_DATE_FORMAT, PlaidService } from '../plaid/plaid.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { PLAID_TEST_ACCOUNT_WITH_ACH_ID } from '../test.constants'
import { TransactionService } from '../transaction/transaction.service'
import { VendorService } from '../transaction/vendor.service'
import { removeDuplicates } from '../utils/data.utils'
import { TransactionPullService } from './transaction-pull.service'

describe('Transaction Pull Service', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let vendorService: VendorService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        vendorService = app.get<VendorService>(VendorService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    it('Should parse transactions without errors', async () => {
        const user = await seedService.seedUser()
        await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        const transactions = await seedService.seedHistoricalTransactionPull(user)

        expect(transactions.length).toBeGreaterThan(0)
    })
    it('Should add unique vendors to our database when encountered', async () => {
        const user = await seedService.seedUser()
        await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        const transactions = await seedService.seedHistoricalTransactionPull(user)
        const uniqueNamesPromise = transactions.map(
            async (transaction) => (await transaction.uniqueVendor).friendlyName
        )
        const uniqueNames = new Set(await Promise.all(uniqueNamesPromise))
        const allVendors = await vendorService.getUniqueVendors()

        expect(uniqueNames.size).toBeGreaterThan(0)
        expect(uniqueNames.size).toBe(allVendors.length)
    })
    it('Should still find matching unique vendors for transactions where the unique vendor has been renamed', async () => {
        const user = await seedService.seedUser()
        const account = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        await seedService.seedHistoricalTransactionPull(user)
        const allUniqueVendors = await vendorService.findUniqueVendorsBy({})
        const uniqueVendor = allUniqueVendors[0]
        const vendorTransactionName = await vendorService.findVendorTransactionNameBy({
            uniqueVendorId: uniqueVendor.id
        })
        await transactionService.findTransactionBy({ uniqueVendorId: uniqueVendor.id })
        await vendorService.patchUniqueVendor(uniqueVendor, {
            friendlyName: faker.company.name(),
            preProcessedLogoWasUploaded: false,
            ppdId: null,
            vendorIdentityCannotBeDetermined: true
        })
        const mockTransaction: TransactionsGetResponse = {
            accounts: [
                {
                    account_id: PLAID_TEST_ACCOUNT_WITH_ACH_ID,
                    balances: {
                        available: 100,
                        current: 110,
                        iso_currency_code: 'USD',
                        limit: null,
                        unofficial_currency_code: null
                    },
                    mask: '0000',
                    name: 'Plaid Checking',
                    official_name: 'Plaid Gold Standard 0% Interest Checking',
                    subtype: AccountSubtype.Checking,
                    type: AccountType.Depository
                }
            ],
            item: {
                available_products: [],
                billed_products: [],
                consent_expiration_time: null,
                error: null,
                institution_id: 'ins_4',
                item_id: 'ALlbWnDvwzsao1ggLo6xslb4bBg1VwC1J76qD',
                webhook: 'https://google.com/plaid/webhook/5',
                update_type: ItemUpdateTypeEnum.Background
            },
            request_id: uuid(),
            total_transactions: 1,
            transactions: [
                {
                    account_id: PLAID_TEST_ACCOUNT_WITH_ACH_ID,
                    account_owner: null,
                    amount: 12,
                    authorized_date: null,
                    category: ['Food and Drink', 'Restaurants', 'Fast Food'],
                    category_id: '13005032',
                    date: '2020-07-11',
                    iso_currency_code: 'USD',
                    location: {
                        address: null,
                        city: null,
                        country: null,
                        lat: null,
                        lon: null,
                        postal_code: null,
                        region: null,
                        store_number: '3322'
                    },
                    merchant_name: vendorTransactionName.merchantName,
                    name: vendorTransactionName.transactionName,
                    payment_channel: TransactionPaymentChannelEnum.InStore,
                    payment_meta: {
                        by_order_of: null,
                        payee: null,
                        payer: null,
                        payment_method: null,
                        payment_processor: null,
                        ppd_id: null,
                        reason: null,
                        reference_number: null
                    },
                    pending: false,
                    pending_transaction_id: null,
                    transaction_code: null,
                    transaction_id: uuid(),
                    transaction_type: TransactionTransactionTypeEnum.Place,
                    unofficial_currency_code: null,
                    check_number: '',
                    authorized_datetime: null,
                    datetime: format(new Date(), PLAID_DATE_FORMAT)
                }
            ]
        }
        const transactions = await transactionPullService.storeTransactions(user, account, mockTransaction)
        const plaidTransaction = transactions[0]
        expect(plaidTransaction.uniqueVendorId).toBe(uniqueVendor.id)
        expect(allUniqueVendors.length).toBe((await vendorService.findUniqueVendorsBy({})).length)
    })
    it('Should attempt to add a default logo for a new unique vendor when encountered', async () => {
        const user = await seedService.seedUser()
        await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        await seedService.seedHistoricalTransactionPull(user)
        const allVendors = await vendorService.getUniqueVendors()
        // In our static JSON uber always has a merchant_name, which is the criteria necessary for us to attempt to automatically extract a logo
        const uber = allVendors.find((vendor) => vendor.friendlyName === 'Uber')
        expect(uber).toBeDefined()
        expect(uber.logoUploadCompleted).toBeTruthy()
        expect(uber.logoS3Key).not.toBeNull()
        expect(uber.logoS3Bucket).not.toBeNull()
    })
    it('Should add vendor transaction names to the database when encountered', async () => {
        const user = await seedService.seedUser()
        await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        const transactions = await seedService.seedHistoricalTransactionPull(user)
        const uniqueNamesPromise = transactions.map(
            async (transaction) => (await transaction.uniqueVendor).friendlyName
        )
        const uniqueNames = new Set(await Promise.all(uniqueNamesPromise))
        const allVendorNames = await vendorService.findVendorTransactionNamesBy({})
        const uniqueVendorIds = removeDuplicates(allVendorNames.map((name) => name.uniqueVendorId))

        expect(uniqueNames.size).toBeGreaterThan(0)
        expect(uniqueNames.size).toBe(uniqueVendorIds.length)
    })
    it('Should use an existing unique vendor when a match occurs for an ACH PPD_ID', async () => {
        // Seed a fake unique vendor + vendor name
        const context = TestingContext.fromApp(app)
        await context.chain(
            () => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID),
            () => context.withUniqueVendor(uuid(), true)
        )
        const uniqueVendor = context.getUniqueVendors()[0]
        // Use the faked plaid service to get plaid transactions
        const plaidService = app.get<PlaidService>(PlaidService)
        const transactionResponse = await plaidService.getTransactionHistory(context.getUserAccount())
        // Grab one of the transactions an manually mutate the name & ppd_id to match the unique vendor
        const transaction = transactionResponse.transactions[0]
        transaction.payment_meta.ppd_id = uniqueVendor.ppdId
        // Process the transaction and ensure it uses the seeded unique vendor
        await transactionPullService.storeTransactions(context.getUser(), context.getUserAccount(), {
            // @ts-ignore - this is the only relevant property in this example
            accounts: [{ account_id: PLAID_TEST_ACCOUNT_WITH_ACH_ID }],
            transactions: [transaction],
            total_transactions: 1,
            item: null,
            request_id: uuid()
        })

        const recordedTransaction = await transactionService.findTransactionBy({
            transactionId: transaction.transaction_id
        })
        expect(recordedTransaction.uniqueVendorId).toBe(uniqueVendor.id)
        expect(recordedTransaction.uniqueVendorId).toBeGreaterThan(0)
    })
    it('Should use an existing unique vendor when a match on the vendor names table occurs', async () => {
        // Seed a fake unique vendor + vendor name
        const context = TestingContext.fromApp(app)
        await context.chain(
            () => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID),
            () => context.withUniqueVendor(uuid(), true)
        )
        const uniqueVendor = context.getUniqueVendors()[0]
        const vendorTransactionName = context.getVendorTransactionNames()[0]
        // Use the faked plaid service to get plaid transactions
        const plaidService = app.get<PlaidService>(PlaidService)
        const transactionResponse = await plaidService.getTransactionHistory(context.getUserAccount())
        // Grab one of the transactions an manually mutate the name to match the unique vendor
        const transaction = transactionResponse.transactions[0]
        transaction.name = vendorTransactionName.transactionName
        // Process the transaction and ensure it uses the seeded unique vendor
        await transactionPullService.storeTransactions(context.getUser(), context.getUserAccount(), {
            // @ts-ignore - this is the only relevant property in this example
            accounts: [{ account_id: PLAID_TEST_ACCOUNT_WITH_ACH_ID }],
            transactions: [transaction],
            total_transactions: 1,
            item: null,
            request_id: uuid()
        })

        const recordedTransaction = await transactionService.findTransactionBy({
            transactionId: transaction.transaction_id
        })
        expect(recordedTransaction.uniqueVendorId).toBe(uniqueVendor.id)
        expect(recordedTransaction.uniqueVendorId).toBeGreaterThan(0)
    })
    it('Should not include duplicate transactions in the response for storeTransactions', async () => {
        const plaidService = app.get<PlaidService>(PlaidService)
        const user = await seedService.seedUser()
        const account = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        const plaidTransactionResponse = await plaidService.getTransactionHistory(account)
        const transactions = await transactionPullService.storeTransactions(user, account, plaidTransactionResponse)
        expect(transactions.length).toBeGreaterThan(0)
        const updatedTransactions = await transactionPullService.storeTransactions(
            user,
            account,
            plaidTransactionResponse
        )
        expect(updatedTransactions.length).toBe(0)
    })
})
