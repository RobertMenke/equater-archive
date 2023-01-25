import { NestExpressApplication } from '@nestjs/platform-express'
import { AuthService } from '../user/auth.service'
import { PushNotificationService } from '../device/push-notification.service'
import { EmailService } from '../email/email.service'
import { PlaidMockService } from '../seeding/plaid-mock.service'
import { SeedingService } from '../seeding/seeding.service'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import {
    ExpenseContributionType,
    SharedExpenseUserAgreement
} from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus } from '../utils/data.utils'
import { ExpenseApiService } from './expense-api.service'
import { TransactionsUpdateHandler } from './transactions-update.handler'
import { VerificationCompleteEvent, VerificationCompleteHandler } from './verification-complete.handler'

describe('Verification Complete Handler', () => {
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
    let pushService: PushNotificationService
    let emailService: EmailService
    let authToken: string
    let handler: VerificationCompleteHandler

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
        payee = await seedService.seedVerifiedUser()
        userAccount = await seedService.seedUserAccount(user)
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
        handler = app.get<VerificationCompleteHandler>(VerificationCompleteHandler)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    it('Should not process any transactions that have been completed', async () => {
        await seedService.seedSharedExpenseTransaction(
            userAccount,
            payeeAccount,
            sharedExpense,
            sharedExpenseUserAgreements[0],
            null,
            true
        )
        const result = await handler.handle(new VerificationCompleteEvent(payee.id))

        expect(result.length).toBe(0)
    })
    it('Should settle transactions that are outstanding', async () => {
        await seedService.seedSharedExpenseTransaction(
            userAccount,
            payeeAccount,
            sharedExpense,
            sharedExpenseUserAgreements[0],
            null,
            false
        )
        const result = await handler.handle(new VerificationCompleteEvent(payee.id))

        expect(result.length).toBe(1)
        expect(result[0].dwollaTransferUrl).toBeDefined()
    })
})
