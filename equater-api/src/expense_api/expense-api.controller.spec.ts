import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { addDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { PushNotificationService } from '../device/push-notification.service'
import { EmailService } from '../email/email.service'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { SeedingService } from '../seeding/seeding.service'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { ExpenseContributionType } from '../shared_expense/shared-expense-user-agreement.entity'
import { ExpenseContribution } from '../shared_expense/shared-expense.dto'
import { RecurringExpenseInterval } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService, TransactionStory, UserAgreementStory } from '../shared_expense/shared-expense.service'
import { CommunicationGateway } from '../socket/communication.gateway'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { AuthService } from '../user/auth.service'
import { MINIMUM_PASSWORD_LENGTH } from '../user/authentication.constants'
import { Relationship } from '../user/relationship.entity'
import { RelationshipService } from '../user/relationship.service'
import { UserInviteService } from '../user/user-invite.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, generateAsync, mapAsync } from '../utils/data.utils'
import { runAfter } from '../utils/test.utils'
import { ExpenseApiController } from './expense-api.controller'
import { CreateRecurringSharedExpenseDto, CreateSharedBillDto, UserAgreementDto } from './expense-api.dto'
import { ExpenseApiService } from './expense-api.service'

describe(ExpenseApiController.name, () => {
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
        user = await seedService.seedVerifiedUser()
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

    //////////////////////////////////////
    // Creating Agreements
    //////////////////////////////////////
    describe('PUT /api/expense/shared-bill', () => {
        it('Should create a shared expense given a unique vendor, a contributionValue, and one or more users to split it with', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    expect(expenses.length).toBe(1)
                    const agreements = await sharedExpenseService.getUserAgreements(expenses.pop())
                    expect(agreements.length).toBe(1)
                    expect(agreements[0].isPending).toBe(true)
                    expect(agreements[0].isActive).toBe(false)
                    expect(agreements[0].dateTimeCreated).not.toBeNull()
                    expect(agreements[0].contributionValue).toBe(dto.activeUsers[payee.id].contributionValue)
                    expect(agreements[0].contributionType).toBe(dto.activeUsers[payee.id].contributionType)
                })
        })
        it('Should save the correct source and destination accounts', async () => {
            const payee = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(user)
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: destinationAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            const response = await supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const id = response.body.sharedExpense.id
            const expense = await sharedExpenseService.findSharedExpenseBy({ id })
            expect(expense.expenseOwnerSourceAccountId).toBe(userAccount.id)
            expect(expense.expenseOwnerDestinationAccountId).toBe(destinationAccount.id)
        })
        it('Should not create a 2nd shared expense agreement for a given vendor if one already exists', async () => {
            const payee = await seedService.seedVerifiedUser()
            await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: {
                        contributionType: ExpenseContributionType.PERCENTAGE,
                        contributionValue: 50
                    }
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
        it('Should create a user invite if prospective users are added to the agreement', async () => {
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {},
                prospectiveUsers: {
                    [faker.internet.email().toLowerCase()]: contribution,
                    [faker.internet.email().toLowerCase()]: contribution
                },
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    const invites = await userInviteService.getInviteByExpenseSharingAgreement(expenses.pop())
                    expect(invites.length).toBe(2)
                    invites.forEach((invite) => {
                        expect(Object.keys(dto.prospectiveUsers).includes(invite.email)).toBe(true)
                    })
                })
        })
        it('Should create a shared expense with a null contributionValue when ExpenseContributionType.SPLIT_EVENLY is selected', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.SPLIT_EVENLY
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    expect(expenses.length).toBe(1)
                    const agreements = await sharedExpenseService.getUserAgreements(expenses.pop())
                    expect(agreements.length).toBe(1)
                    expect(agreements[0].isPending).toBe(true)
                    expect(agreements[0].isActive).toBe(false)
                    expect(agreements[0].contributionType).toBe(ExpenseContributionType.SPLIT_EVENLY)
                    expect(agreements[0].contributionValue).toBeNull()
                    expect(agreements[0].dateTimeCreated).not.toBeNull()
                    expect(agreements[0].contributionType).toBe(dto.activeUsers[payee.id].contributionType)
                })
        })
        it('Should record a nickname when an expense is created', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    expect(expenses[0].expenseNickName).toBe(dto.expenseNickName)
                })
        })
        it('Should send push notifications to users for which an agreement has been requested', async () => {
            const payee = await seedService.seedVerifiedUser()
            const device = await seedService.seedUserDevice(payee)
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.SPLIT_EVENLY,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const notifications = await pushService.findWhere({ deviceId: device.id })
                    expect(notifications.length).toBe(1)
                })
        })
        it('Should send emails to invited users for which an agreement has been requested', async () => {
            const spy = jest.spyOn(emailService, 'sendInviteToParticipateInExpenseAgreementEmail')
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.SPLIT_EVENLY,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {},
                prospectiveUsers: {
                    [faker.internet.email()]: contribution
                },
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    expect(spy.mock.calls.length).toBe(1)
                })
        })
        it('Should create an unconfirmed relationship between a payee and a user', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.SPLIT_EVENLY,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // wait a second because the relationship gets created via an event bus asynchronously
                    const relationship = await runAfter(1000, () => {
                        return relationshipService.findRelationship(user, payee)
                    })

                    expect(relationship).toBeInstanceOf(Relationship)
                    expect(relationship.isConfirmed).toBeFalsy()
                })
        })
        it('Should respond with 403 when a user has not confirmed their email', async () => {
            const unauthorizedUser = await seedService.seedUser()
            const payee = await seedService.seedUser()
            const token = unauthorizedUser.sessionToken
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.FORBIDDEN)
                .then(async (response) => {
                    expect(response.body.message).toBe('email-confirmation-required')
                })
        })
        it('Should broadcast an event over a websocket when an agreement is created', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            await supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
            const agreements = await sharedExpenseService.getUserAgreements(expenses.pop())

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(agreements.length + 1)
            })
        })
        it(`Should respond with ${HttpStatus.UNPROCESSABLE_ENTITY} when a non-depository account is sent as the destination account`, async () => {
            const payee = await seedService.seedVerifiedUser()
            let destinationAccount = await seedService.seedUserAccount(user)
            destinationAccount.accountType = PlaidSupportedAccountType.CREDIT
            destinationAccount.accountSubType = 'credit card'
            await userAccountService.save(destinationAccount)
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: destinationAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }

            await supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
        it('Should increment the total number of agreements for the vendor the shared bill is based on', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateSharedBillDto = {
                uniqueVendorId: vendor.id,
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                expenseOwnerDestinationAccountId: userAccount.id,
                expenseOwnerSourceAccountId: userAccount.id
            }
            const countOfVendorAgreements = vendor.totalNumberOfExpenseSharingAgreements

            await supertest(app.getHttpServer())
                .put(`/api/expense/shared-bill`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedVendor = await vendorService.findUniqueVendorBy({ id: vendor.id })
            expect(updatedVendor.totalNumberOfExpenseSharingAgreements).toBe(countOfVendorAgreements + 1)
        })
    })

    describe('PUT /api/expense/recurring-payment', () => {
        it('Should create a shared expense given a starting date, a recurrence period (months/days/years), an contributionValue, and one or more users to split it with', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    expect(expenses.length).toBe(1)
                    const agreements = await sharedExpenseService.getUserAgreements(expenses.pop())
                    expect(agreements.length).toBe(1)
                    expect(agreements[0].isPending).toBe(true)
                    expect(agreements[0].isActive).toBe(false)
                    expect(agreements[0].dateTimeCreated).not.toBeNull()
                    expect(agreements[0].contributionValue).toBe(dto.activeUsers[payee.id].contributionValue)
                    expect(agreements[0].contributionType).toBe(dto.activeUsers[payee.id].contributionType)
                })
        })
        it('Should set the dateNextPaymentScheduled property to the starting date when the payment is created', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
                    expect(expenses[0].dateNextPaymentScheduled).not.toBeNull()
                    expect(expenses[0].dateNextPaymentScheduled.getTime()).toBe(
                        expenses[0].targetDateOfFirstCharge.getTime()
                    )
                })
        })
        it('Should send push notifications to users for which an agreement has been requested', async () => {
            const payee = await seedService.seedVerifiedUser()
            const device = await seedService.seedUserDevice(payee)
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const notifications = await pushService.findWhere({ deviceId: device.id })
                    expect(notifications.length).toBe(1)
                })
        })
        it('Should send emails to invited users for which an agreement has been requested', async () => {
            const spy = jest.spyOn(emailService, 'sendInviteToParticipateInExpenseAgreementEmail')
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {},
                prospectiveUsers: {
                    [faker.internet.email()]: contribution
                },
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    expect(spy.mock.calls.length).toBe(1)
                })
        })
        it('Should create an unconfirmed relationship between a payee and a user', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // wait a second because the relationship gets created via an event bus asynchronously
                    const relationship = await runAfter(1000, () => {
                        return relationshipService.findRelationship(user, payee)
                    })

                    expect(relationship).toBeInstanceOf(Relationship)
                    expect(relationship.isConfirmed).toBeFalsy()
                })
        })
        it('Should respond with 403 when a user has not confirmed their email', async () => {
            const unconfirmedUser = await seedService.seedUser()
            const token = unconfirmedUser.sessionToken
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            return supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.FORBIDDEN)
                .then(async (response) => {
                    expect(response.body.message).toBe('email-confirmation-required')
                })
        })
        it('Should broadcast an event over a websocket when an agreement is created', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            await supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
            const agreements = await sharedExpenseService.getUserAgreements(expenses.pop())

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(agreements.length + 1)
            })
        })
        it('Should convert start date and end date to 0 hours, 0 minutes, and 0 seconds', async () => {
            const payee = await seedService.seedVerifiedUser()
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: addDays(new Date(), 10).toISOString(),
                expenseOwnerDestinationAccountId: userAccount.id
            }

            await supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const expenses = await sharedExpenseService.getSharedExpensesForUser(user)
            expect(expenses.length).toBe(1)
            const expense = expenses[0]
            expect(expense.targetDateOfFirstCharge.getHours()).toBe(0)
            expect(expense.targetDateOfFirstCharge.getMinutes()).toBe(0)
            expect(expense.targetDateOfFirstCharge.getSeconds()).toBe(0)
            expect(expense.recurringPaymentEndDate.getHours()).toBe(0)
            expect(expense.recurringPaymentEndDate.getMinutes()).toBe(0)
            expect(expense.recurringPaymentEndDate.getSeconds()).toBe(0)
        })
        it(`Should respond with ${HttpStatus.UNPROCESSABLE_ENTITY} when a non-depository account is sent as the destination account`, async () => {
            const payee = await seedService.seedVerifiedUser()
            let destinationAccount = await seedService.seedUserAccount(user)
            destinationAccount.accountType = PlaidSupportedAccountType.CREDIT
            destinationAccount.accountSubType = 'credit card'
            await userAccountService.save(destinationAccount)
            const contribution: ExpenseContribution = {
                contributionType: ExpenseContributionType.PERCENTAGE,
                contributionValue: 50
            }
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [payee.id]: contribution
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: destinationAccount.id
            }

            await supertest(app.getHttpServer())
                .put(`/api/expense/recurring-payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
    })

    describe('PATCH /api/expense/:sharedExpenseId', () => {
        it('Should set an expense as inactive when requested', async () => {
            const sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${sharedExpense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expense = await sharedExpenseService.findSharedExpenseBy({ id: sharedExpense.id })
                    expect(expense.isActive).toBe(false)
                })
        })
        it('Should set all agreements as inactive when an expense is deactivated', async () => {
            const sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            await seedService.seedSharedExpenseUserAgreements(
                sharedExpense,
                5,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${sharedExpense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const expense = await sharedExpenseService.findSharedExpenseBy({ id: sharedExpense.id })
                    const modifiedAgreements = await expense.userAgreements
                    expect(modifiedAgreements.length).toBe(5)
                    modifiedAgreements.forEach((agreement) => {
                        expect(agreement.isActive).toBe(false)
                        expect(agreement.dateTimeBecameInactive).toBeInstanceOf(Date)
                    })
                })
        })
        it('Should respond with 403 forbidden when someone other than the expense owner attempts to patch', async () => {
            const sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const maliciousUser = await seedService.seedVerifiedUser()
            const maliciousAuthToken = maliciousUser.sessionToken

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${sharedExpense.id}`)
                .set('Authorization', `Bearer ${maliciousAuthToken}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should respond with 404 not found when no shared expense is found', async () => {
            const sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${sharedExpense.id + 100}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it('Should respond with 403 when a user has not confirmed their email', async () => {
            const unconfirmedUser = await seedService.seedUser()
            const token = unconfirmedUser.sessionToken
            const sharedExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${sharedExpense.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
                .then(async (response) => {
                    expect(response.body.message).toBe('email-confirmation-required')
                })
        })
    })

    describe('PATCH /api/expense/agreement', () => {
        it('Should set a shared expense user agreement as active when a user agrees to share an expense', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            //Confirm that the agreement is not active
            const updatedAgreement = await sharedExpenseService.findAgreementBy({
                id: agreement.id
            })

            expect(updatedAgreement).not.toBeNull()
            expect(updatedAgreement.isActive).toBe(true)
            expect(updatedAgreement.dateTimeBecameActive).toBeInstanceOf(Date)
            expect(updatedAgreement.paymentAccountId).toBe(payeeAccount.id)

            //Confirm that the overall shared expense is not yet active because not all parties have agreed
            const sharedExpense = await updatedAgreement.sharedExpense
            expect(sharedExpense).not.toBeNull()
            expect(sharedExpense.isActive).toBe(false)
        })
        it('Should set the shared expense as active when all parties have agreed to pay', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 1)
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedAgreement = await sharedExpenseService.findAgreementBy({
                id: agreement.id
            })
            const updatedExpense = await updatedAgreement.sharedExpense
            expect(updatedAgreement).not.toBe(null)
            expect(updatedAgreement.isActive).toBe(true)
            expect(updatedAgreement.dateTimeBecameActive).toBeInstanceOf(Date)
            expect(updatedExpense).not.toBe(null)
            expect(updatedExpense.isActive).toBe(true)
        })
        it('Should send 1 notification to each user when more than 2 parties are involved in a shared bill', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 2)
            const allUsers = await userService.findMany({})
            await mapAsync(allUsers, (item) => seedService.seedUserDevice(item))
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const notifications = await pushService.findWhere({})
            expect(notifications.length).toBe(3)
        })
        it('Should not set the shared expense as active when there are pending email invites', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 1)
            await seedService.seedUserInvite(user, expense, faker.internet.email())
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedAgreement = await sharedExpenseService.findAgreementBy({
                id: agreement.id
            })
            const updatedExpense = await updatedAgreement.sharedExpense
            expect(updatedExpense).not.toBe(null)
            expect(updatedExpense.isActive).toBe(false)
        })
        it('Should ensure that the expense is inactive if any agreement is declined', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                3,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            //Confirm that the agreement is not active
            const updatedAgreement = await sharedExpenseService.findAgreementBy({
                id: agreement.id
            })

            expect(updatedAgreement).not.toBeNull()
            expect(updatedAgreement.isActive).toBe(false)
            expect(updatedAgreement.dateTimeBecameInactive).toBeInstanceOf(Date)

            //Confirm that the overall shared expense is not yet active because not all parties have agreed
            const sharedExpense = await updatedAgreement.sharedExpense
            expect(sharedExpense).not.toBeNull()
            expect(sharedExpense.isActive).toBe(false)
        })
        it("Should respond with 403 forbidden when a request is made using another user's auth token", async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                3,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements.pop()
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.FORBIDDEN)
        })
        it("Should respond with 404 not found when a request is made for an agreement that doesn't exist", async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                3,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements.pop()
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id + 100,
                doesAcceptAgreement: false
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(dto)
                .expect(HttpStatus.NOT_FOUND)
        })
        it('Should send the expense owner a notification when the agreement is accepted', async () => {
            const spy = jest.spyOn(emailService, 'sendExpenseAgreementUpdate')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements[agreements.length - 1]
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const device = await seedService.seedUserDevice(user)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            expect(spy.mock.calls.length).toBe(agreements.length + 1)
            const notifications = await pushService.findWhere({ deviceId: device.id })
            expect(notifications.length).toBe(1)
        })
        it('Should send the expense owner a notification when the agreement is declined', async () => {
            const spy = jest.spyOn(emailService, 'sendExpenseAgreementUpdate')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_INACTIVE)
            let agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            agreements = agreements.concat(
                await seedService.seedSharedExpenseUserAgreements(
                    expense,
                    1,
                    ExpenseContributionType.SPLIT_EVENLY,
                    BinaryStatus.IS_INACTIVE
                )
            )
            const agreement = agreements[agreements.length - 1]
            const payee = await agreement.user
            const device = await seedService.seedUserDevice(user)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            return supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // In this case the overall status of the shared expense changes so each party
                    // gets 2 notifications - 1 for the agreement update and 1 for the expense status update
                    expect(spy.mock.calls.length).toBe(agreements.length * 2 + 2)
                    const notifications = await pushService.findWhere({ deviceId: device.id })
                    expect(notifications.length).toBe(2)
                })
        })
        it('Should send the expense owner a shared expense becomes active', async () => {
            const spy = jest.spyOn(emailService, 'sendExpenseAgreementUpdate')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 1)
            const agreement = agreements[agreements.length - 1]
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const device = await seedService.seedUserDevice(user)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            await runAfter(1000, async () => {
                // In this case the overall status of the shared expense changes so each party
                // gets 2 notifications - 1 for the agreement update and 1 for the expense status update
                expect(spy.mock.calls.length).toBe(agreements.length * 2 + 2)
                const notifications = await pushService.findWhere({ deviceId: device.id })
                expect(notifications.length).toBe(2)
            })
        })
        it('Should send the expense owner a shared expense goes from active to inactive', async () => {
            const spy = jest.spyOn(emailService, 'sendExpenseAgreementUpdate')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                3,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[agreements.length - 1]
            const payee = await agreement.user
            const device = await seedService.seedUserDevice(user)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            await runAfter(1000, async () => {
                // In this case the overall status of the shared expense changes so each party
                // gets 2 notifications - 1 for the agreement update and 1 for the expense status update
                expect(spy.mock.calls.length).toBe(agreements.length * 2 + 2)
                const notifications = await pushService.findWhere({ deviceId: device.id })
                expect(notifications.length).toBe(2)
            })
        })
        it('Should create a confirmed relationship when the payee agrees', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            await seedService.seedRelationship(user, payee, BinaryStatus.IS_INACTIVE)
            await seedService.seedUserDevice(user)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            return supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // Run after 1 second because updating the relationship happens asynchronously via an event bus
                    const relationship = await runAfter(1000, () => {
                        return relationshipService.findRelationship(user, payee)
                    })
                    expect(relationship).toBeInstanceOf(Relationship)
                    expect(relationship.isConfirmed).toBeTruthy()
                    expect(relationship.dateTimeConfirmed).toBeInstanceOf(Date)
                })
        })
        it('Should not create a confirmed relationship when the payee declines', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_INACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_INACTIVE
            )
            const agreement = agreements.pop()
            const payee = await agreement.user
            await seedService.seedUserDevice(user)
            await seedService.seedRelationship(user, payee, BinaryStatus.IS_INACTIVE)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            return supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // Run after 1 second because updating the relationship happens asynchronously via an event bus
                    const relationship = await runAfter(1000, () => {
                        return relationshipService.findRelationship(user, payee)
                    })
                    expect(relationship).toBeInstanceOf(Relationship)
                    expect(relationship.isConfirmed).toBeFalsy()
                    expect(relationship.dateTimeConfirmed).toBeNull()
                })
        })
        it('Should not disconfirm an already confirmed relationship when the payee declines', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_INACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_INACTIVE
            )
            const agreement = agreements.pop()
            const payee = await agreement.user
            await seedService.seedUserDevice(user)
            await seedService.seedRelationship(user, payee, BinaryStatus.IS_ACTIVE)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: false
            }

            return supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    // Run after 1 second because updating the relationship happens asynchronously via an event bus
                    const relationship = await runAfter(1000, () => {
                        return relationshipService.findRelationship(user, payee)
                    })
                    expect(relationship).toBeInstanceOf(Relationship)
                    expect(relationship.isConfirmed).toBeTruthy()
                    expect(relationship.dateTimeConfirmed).toBeInstanceOf(Date)
                })
        })
        it('Should respond with 403 when a user has not confirmed their email', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const numberOfAgreements = 3
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                numberOfAgreements,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_INACTIVE,
                await generateAsync(numberOfAgreements, () => seedService.seedUser())
            )
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            return supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.FORBIDDEN)
                .then(async (response) => {
                    expect(response.body.message).toBe('email-confirmation-required')
                })
        })
        it('Should broadcast an event over a websocket when an agreement is interacted with', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements[agreements.length - 1]
            const payee = await agreement.user
            const payeeAccount = await seedService.seedUserAccount(payee)
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.OK)

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(agreements.length + 1)
            })
        })
        it(`Should respond with ${HttpStatus.UNPROCESSABLE_ENTITY} when a payment account is not supplied with an accepted agreement`, async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements.pop()
            const payee = await agreement.user
            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
        it(`Should respond with ${HttpStatus.UNPROCESSABLE_ENTITY} when a payment account supplied with an accepted agreement is not a depository account`, async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)
            const agreement = agreements.pop()
            const payee = await agreement.user

            let payeeAccount = await seedService.seedUserAccount(payee)
            payeeAccount.accountType = PlaidSupportedAccountType.CREDIT
            payeeAccount.accountSubType = 'credit card'
            await userAccountService.save(payeeAccount)

            const payeeAuthToken = payee.sessionToken
            const dto: UserAgreementDto = {
                userAgreementId: agreement.id,
                doesAcceptAgreement: true,
                paymentAccountId: payeeAccount.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/expense/agreement`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
    })

    //////////////////////////////////////
    // Retrieving Agreements
    //////////////////////////////////////
    describe('GET /api/expense/:id', () => {
        it('Should retrieve a shared expense by id', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)

            return supertest(app.getHttpServer())
                .get(`/api/expense/${expense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.id).toBe(expense.id)
                })
        })
        it('Should respond with 404 when a shared expense is not found', () => {
            return supertest(app.getHttpServer())
                .get(`/api/expense/10`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /api/expense/user/:userId', () => {
        it('Should retrieve only active shared expenses for a user when specified', async () => {
            const activeExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_INACTIVE)

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}?isActive=true`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.length).toBe(1)
                    expect(response.body[0].sharedExpense.id).toBe(activeExpense.id)
                })
        })
        it('Should retrieve only pending shared expenses for a user when specified', async () => {
            await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}?isPending=true`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.length).toBe(1)
                    expect(response.body[0].sharedExpense.id).toBe(inactiveExpense.id)
                })
        })
        it('Should retrieve shared expenses originated by a given user', async () => {
            const activeExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const randomUser = await seedService.seedVerifiedUser()
            await seedService.seedSharedBill(randomUser, userAccount, vendor, BinaryStatus.IS_INACTIVE)

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.length).toBe(2)
                    const expectedIds = [activeExpense.id, inactiveExpense.id]
                    response.body.forEach((item) => {
                        expect(expectedIds.includes(item.sharedExpense.id)).toBe(true)
                    })
                })
        })
        it("Should respond with 403 forbidden when a different user's access token is provided", async () => {
            const maliciousUser = await seedService.seedVerifiedUser()
            const maliciousAuthToken = maliciousUser.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}`)
                .set('Authorization', `Bearer ${maliciousAuthToken}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should respond with a merchant given the presence of a merchant shared expense', async () => {
            await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.length).toBe(1)
                    expect(response.body[0].vendor).not.toBeNull()
                })
        })
        it('Should respond with no merchant given the absence of a merchant shared expense and presence of a recurring expense', async () => {
            const dto: CreateRecurringSharedExpenseDto = {
                expenseNickName: faker.lorem.words(3),
                activeUsers: {
                    [(await seedService.seedVerifiedUser()).id]: {
                        contributionType: ExpenseContributionType.SPLIT_EVENLY,
                        contributionValue: 50
                    }
                },
                prospectiveUsers: {},
                interval: RecurringExpenseInterval.MONTHS,
                expenseFrequency: 1,
                startDate: new Date().toISOString(),
                endDate: null,
                expenseOwnerDestinationAccountId: userAccount.id
            }

            await seedService.seedRecurringPayment(user, dto, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/${user.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.length).toBe(1)
                    expect(response.body[0].vendor).toBeNull()
                })
        })
    })

    describe('GET /api/expense/user/agreements/:userId', () => {
        it('Should retrieve shared expense agreements a user participates in given a user id. The response should be a shared expense "story"', async () => {
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(inactiveExpense, 2)
            const payee = await agreements[0].user
            const payeeAuthToken = payee.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/agreements/${payee.id}`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const stories: UserAgreementStory[] = response.body
                    expect(stories[0].hasOwnProperty('initiatingUser')).toBe(true)
                    expect(stories[0].hasOwnProperty('sharedExpense')).toBe(true)
                    expect(stories[0].hasOwnProperty('userAgreement')).toBe(true)
                })
        })
        it('Should retrieve only active shared expense agreements a user participates in given a user id when specified', async () => {
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const activeExpense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const payee = await seedService.seedVerifiedUser()
            await seedService.seedSharedExpenseUserAgreements(inactiveExpense, 2)
            const activeAgreements = await seedService.seedSharedExpenseUserAgreements(
                activeExpense,
                2,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [payee]
            )
            const payeeAuthToken = payee.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/agreements/${payee.id}?isActive=true`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const expectedAgreements = activeAgreements.map((agreement) => agreement.id)
                    expect(response.body.length).toBe(1)
                    response.body.forEach((item) => {
                        expect(item.sharedExpense.id).toBe(activeExpense.id)
                        expect(expectedAgreements.includes(item.userAgreement.id)).toBe(true)
                    })
                })
        })
        it("Should respond with 403 forbidden when an expense agreement is attempted to be retrieved with another user's auth token", async () => {
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(inactiveExpense, 2)
            const payee = await agreements[0].user
            const maliciousUser = await seedService.seedVerifiedUser()
            const maliciousToken = maliciousUser.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/agreements/${payee.id}`)
                .set('Authorization', `Bearer ${maliciousToken}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should retrieve both active users and prospective users that are part of the agreement', async () => {
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(inactiveExpense, 2)
            await seedService.seedUserInvite(user, inactiveExpense, faker.internet.email())
            const payee = await agreements[0].user
            const payeeAuthToken = payee.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/agreements/${payee.id}`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const stories: UserAgreementStory[] = response.body
                    expect(stories[0].hasOwnProperty('initiatingUser')).toBe(true)
                    expect(stories[0].hasOwnProperty('sharedExpense')).toBe(true)
                    expect(stories[0].hasOwnProperty('userAgreement')).toBe(true)
                    expect(stories[0].hasOwnProperty('activeUsers')).toBe(true)
                    expect(stories[0].hasOwnProperty('prospectiveUsers')).toBe(true)
                    expect(stories[0].activeUsers.length).toBe(2)
                    expect(stories[0].prospectiveUsers.length).toBe(1)
                })
        })
        it('Should not retrieve prospective users that have already been converted to users', async () => {
            const inactiveExpense = await seedService.seedSharedBill(
                user,
                userAccount,
                vendor,
                BinaryStatus.IS_INACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(inactiveExpense, 2)
            await seedService.seedUserInvite(user, inactiveExpense, faker.internet.email())
            const payee = await agreements[0].user
            const payeeAuthToken = payee.sessionToken
            // For this test, convert the invite into a user immediately
            const userInviteService = app.get<UserInviteService>(UserInviteService)
            const invites = await userInviteService.getInviteByExpenseSharingAgreement(inactiveExpense)
            await mapAsync(invites, async (invite) => {
                const user = await userService.register({
                    email: invite.email,
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
                })

                return await userInviteService.handleConversionToUser(user, [invite])
            })

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/agreements/${payee.id}`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const stories: UserAgreementStory[] = response.body
                    expect(stories[0].hasOwnProperty('initiatingUser')).toBe(true)
                    expect(stories[0].hasOwnProperty('sharedExpense')).toBe(true)
                    expect(stories[0].hasOwnProperty('userAgreement')).toBe(true)
                    expect(stories[0].hasOwnProperty('activeUsers')).toBe(true)
                    expect(stories[0].hasOwnProperty('prospectiveUsers')).toBe(true)
                    expect(stories[0].activeUsers.length).toBe(3)
                    expect(stories[0].prospectiveUsers.length).toBe(0)
                })
        })
    })

    describe('GET /api/expense/user/transactions/:userId', () => {
        it("Should respond with TransactionStory[] when queried using the payee's information", async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            const transaction = await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/transactions/${user.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const body: TransactionStory[] = response.body
                    expect(body.length).toBeGreaterThan(0)
                    expect(body[0].sharedExpense.id).toBe(expense.id)
                    expect(body[0].recipient.id).toBe(destinationUser.id)
                    expect(body[0].payer.id).toBe(user.id)
                    expect(body[0].transaction.id).toBe(transaction.id)
                })
        })
        it("Should respond with TransactionStory[] when queried using the expense owner's information", async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationUserAuthToken = destinationUser.sessionToken
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            const transaction = await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/transactions/${destinationUser.id}`)
                .set('Authorization', `Bearer ${destinationUserAuthToken}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const body: TransactionStory[] = response.body
                    expect(body.length).toBeGreaterThan(0)
                    expect(body[0].sharedExpense.id).toBe(expense.id)
                    expect(body[0].recipient.id).toBe(destinationUser.id)
                    expect(body[0].payer.id).toBe(user.id)
                    expect(body[0].transaction.id).toBe(transaction.id)
                })
        })
        it('Should not respond with transaction data for transactions that have never been attempted', async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                false
            )

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/user/transactions/${user.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: TransactionStory[] = response.body
            expect(body.length).toBe(0)
        })
        it("Should not allow a signed in user to query another user's transaction history", async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationUserAuthToken = destinationUser.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/transactions/${user.id}`)
                .set('Authorization', `Bearer ${destinationUserAuthToken}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should respond with 403 forbidden when an auth token for a different user is supplied', async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const maliciousUser = await seedService.seedVerifiedUser()
            const maliciousAuthToken = maliciousUser.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/expense/user/transactions/${destinationUser.id}`)
                .set('Authorization', `Bearer ${maliciousAuthToken}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/expense/transaction/:id', () => {
        it('Should fetch a transaction story', async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            const transaction = await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/transaction/${transaction.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: TransactionStory = response.body
            expect(body.transaction.id).toBe(transaction.id)
        }, 60_000)
        it('Should allow admins to fetch a transaction story', async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            const transaction = await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            const admin = await seedService.seedAdmin()

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/transaction/${transaction.id}`)
                .set('Authorization', `Bearer ${admin.sessionToken}`)
                .expect(HttpStatus.OK)

            const body: TransactionStory = response.body
            expect(body.transaction.id).toBe(transaction.id)
        }, 60_000)
        it(`Should respond with ${HttpStatus.NOT_FOUND} when the transaction does not exist`, async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            await supertest(app.getHttpServer())
                .get(`/api/expense/transaction/9999`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND)
        }, 60_000)
        it(`Should respond with ${HttpStatus.NOT_FOUND} when the user is not an admin and is neither the recipient nor payer`, async () => {
            const destinationUser = await seedService.seedVerifiedUser()
            const destinationAccount = await seedService.seedUserAccount(destinationUser)
            const sourceUserAccount = userAccount
            const expense = await seedService.seedSharedBill(
                destinationUser,
                userAccount,
                vendor,
                BinaryStatus.IS_ACTIVE
            )
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE,
                [user]
            )
            const transaction = await seedService.seedSharedExpenseTransaction(
                sourceUserAccount,
                destinationAccount,
                expense,
                agreements[0],
                null,
                true
            )

            const randomUser = await seedService.seedUser()

            await supertest(app.getHttpServer())
                .get(`/api/expense/transaction/${transaction.id}`)
                .set('Authorization', `Bearer ${randomUser.sessionToken}`)
                .expect(HttpStatus.NOT_FOUND)
        }, 60_000)
    })

    describe('GET /api/expense/agreements/:id', () => {
        it('Should retrieve an agreement story by id', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[0]
            const payee = await agreement.user
            const payeeAuthToken = payee.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/agreement/${agreement.id}`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)

            const body: UserAgreementStory = response.body
            expect(body.userAgreement.id).toBe(agreement.id)
        })
        it('Should allow admins to retrieve an agreement they are not personally a part of', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[0]
            const admin = await seedService.seedAdmin()
            const authToken = admin.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/agreement/${agreement.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            const body: UserAgreementStory = response.body
            expect(body.userAgreement.id).toBe(agreement.id)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when a regular user attempts to access an agreement they don't belong to`, async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[0]
            const randomUser = await seedService.seedUser()
            const authToken = randomUser.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/expense/agreement/${agreement.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when an agreement matching :id is not found`, async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[0]
            const randomUser = await agreement.user
            const authToken = randomUser.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/expense/agreement/999999`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it('Should respond with a valid vendor url', async () => {
            await seedService.addVendorLogo(app, vendor)
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            const agreements = await seedService.seedSharedExpenseUserAgreements(
                expense,
                1,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )
            const agreement = agreements[0]
            const payee = await agreement.user
            const payeeAuthToken = payee.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/expense/agreement/${agreement.id}`)
                .set('Authorization', `Bearer ${payeeAuthToken}`)
                .expect(HttpStatus.OK)

            const body: UserAgreementStory = response.body
            expect(body.userAgreement.id).toBe(agreement.id)
            expect(body.vendor).toBeDefined()
            expect(body.vendor.logoUrl.length).toBeGreaterThan(0)
        })
    })

    //////////////////////////////////////
    // Updating Agreements
    //////////////////////////////////////
    describe('PATCH /api/expense/deactivate/:expenseId', () => {
        it('Should be able to deactivate an agreement given a shared expense id', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${expense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const updatedExpense = await sharedExpenseService.findSharedExpenseBy({ id: expense.id })
                    expect(updatedExpense.isActive).toBe(false)
                    expect(updatedExpense.dateTimeDeactivated).not.toBeNull()
                })
        })
        it('Should deactivate all shared expense user agreements when an expense sharing agreement is deactivated', async () => {
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)
            await seedService.seedSharedExpenseUserAgreements(
                expense,
                5,
                ExpenseContributionType.SPLIT_EVENLY,
                BinaryStatus.IS_ACTIVE
            )

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${expense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const updatedExpense = await sharedExpenseService.findSharedExpenseBy({ id: expense.id })
                    const updatedAgreements = await updatedExpense.userAgreements
                    expect(updatedExpense.isActive).toBe(false)
                    expect(updatedExpense.dateTimeDeactivated).not.toBeNull()
                    updatedAgreements.forEach((agreement) => {
                        expect(agreement.isActive).toBe(false)
                        expect(agreement.dateTimeBecameInactive).not.toBeNull()
                    })
                })
        })
        it('Should respond with 403 when a user has not confirmed their email', async () => {
            const unconfirmedUser = await seedService.seedUser()
            const token = unconfirmedUser.sessionToken
            const expense = await seedService.seedSharedBill(user, userAccount, vendor, BinaryStatus.IS_ACTIVE)

            return supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${expense.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
                .then(async (response) => {
                    expect(response.body.message).toBe('email-confirmation-required')
                })
        })
        it('Should end out push notifications and emails when the expense gets deactivated', async () => {
            const pushNotificationSpy = jest.spyOn(userService, 'sendPushNotification')
            const emailSpy = jest.spyOn(emailService, 'sendNotificationEmail')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)

            await supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${expense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            expect(pushNotificationSpy.mock.calls.length).toBe(agreements.length + 1)
            expect(emailSpy.mock.calls.length).toBe(agreements.length + 1)
        })
        it('Should broadcast an event over a websocket when an agreement is deactivated', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const expense = await seedService.seedSharedBill(user, userAccount, vendor)
            const agreements = await seedService.seedSharedExpenseUserAgreements(expense, 3)

            await supertest(app.getHttpServer())
                .patch(`/api/expense/deactivate/${expense.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK)

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(agreements.length + 1)
            })
        })
    })
})
