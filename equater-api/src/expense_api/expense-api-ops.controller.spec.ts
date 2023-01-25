import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { PushNotificationService } from '../device/push-notification.service'
import { EmailService } from '../email/email.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { AuthService } from '../user/auth.service'
import { MINIMUM_PASSWORD_LENGTH } from '../user/authentication.constants'
import { RelationshipService } from '../user/relationship.service'
import { UserInviteService } from '../user/user-invite.service'
import { Role, User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus } from '../utils/data.utils'
import { AgreementWatchlist, ExpenseApiOpsController } from './expense-api-ops.controller'
import { ExpenseApiService } from './expense-api.service'

describe(ExpenseApiOpsController.name, () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let authService: AuthService
    let userService: UserService
    let userInviteService: UserInviteService
    let userAccountService: UserAccountService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let vendorService: VendorService
    let sharedExpenseService: SharedExpenseService
    let expenseApiService: ExpenseApiService
    let vendor: UniqueVendor
    let user: User
    let userAccount: UserAccount
    let pushService: PushNotificationService
    let emailService: EmailService
    let relationshipService: RelationshipService
    let authToken: string

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        authService = app.get<AuthService>(AuthService)
        userService = app.get<UserService>(UserService)
        userAccountService = app.get<UserAccountService>(UserAccountService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        vendorService = app.get<VendorService>(VendorService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        expenseApiService = app.get<ExpenseApiService>(ExpenseApiService)
        userInviteService = app.get<UserInviteService>(UserInviteService)
        pushService = app.get<PushNotificationService>(PushNotificationService)
        emailService = app.get<EmailService>(EmailService)
        relationshipService = app.get<RelationshipService>(RelationshipService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        user = await seedService.seedUser(
            new User({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                role: Role.ADMIN
            })
        )
        authToken = user.sessionToken
        userAccount = await seedService.seedUserAccount(user)
        await seedService.seedHistoricalTransactionPull(user)
        vendor = (await vendorService.getUniqueVendors()).pop()
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    describe('GET /api/expense/ops/agreement-watchlist', () => {
        async function createSharedBill(vendor?: UniqueVendor): Promise<TestingContext> {
            let context = TestingContext.fromApp(app)
            // Creates a shared bill with 1 payee and an active agreement
            context = await context.chain(
                context.withUser,
                context.withLinkedBankAccount,
                () => context.withPayees(1),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE, vendor),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            return context
        }

        it('Should retrieve a list of agreements that have never been matched to a plaid transaction, but where the unique vendor has been matched to other transactions in the past', async () => {
            // 2 separate agreements: 1 has an agreement and a successful transaction and the other just has an agreement.
            // The first agreement should show up in our watchlist.
            const firstAgreementContext = await createSharedBill()
            const secondAgreementContext = await createSharedBill(firstAgreementContext.getUniqueVendor())
            await secondAgreementContext.withSharedExpenseTransaction(true)

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/ops/agreement-watchlist`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: AgreementWatchlist = response.body
            expect(body.newAgreements.length).toBe(1)
            expect(body.newAgreements[0].agreements[0].id).toBe(
                firstAgreementContext.getSharedExpenseUserAgreements()[0].id
            )
            expect(body.newAgreementsWithNewVendors.length).toBe(0)
        }, 60_000)
        it('Should retrieve a list of shared bills based on a unique vendor Equater has never matched to a plaid transaction', async () => {
            // 2 separate agreements: 1 has an agreement and a successful transaction and the other just has an agreement.
            // The first agreement should show up in our watchlist.
            const firstAgreementContext = await createSharedBill()
            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/ops/agreement-watchlist`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: AgreementWatchlist = response.body
            expect(body.newAgreements.length).toBe(0)
            expect(body.newAgreementsWithNewVendors.length).toBe(1)
            expect(body.newAgreementsWithNewVendors[0].agreements[0].id).toBe(
                firstAgreementContext.getSharedExpenseUserAgreements()[0].id
            )
        }, 60_000)
        it('Should respond with 2 empty lists when no shared bills meet that criteria', async () => {
            // Create a single agreement that also has been matched to a shared expense
            const context = await createSharedBill()
            await context.withSharedExpenseTransaction(true)

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/ops/agreement-watchlist`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: AgreementWatchlist = response.body
            expect(body.newAgreements.length).toBe(0)
            expect(body.newAgreementsWithNewVendors.length).toBe(0)
        }, 60_000)
    })
})
