import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Job } from 'bull'
import { addMinutes, subMinutes, addDays, addMonths, subDays } from 'date-fns'
import { Repository } from 'typeorm'
import { PushNotificationService } from '../device/push-notification.service'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { EmailService } from '../email/email.service'
import { PlaidServiceFake } from '../plaid/plaid.service.fake'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { ExpenseContributionType } from '../shared_expense/shared-expense-user-agreement.entity'
import { RecurringExpenseInterval } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { CommunicationGateway } from '../socket/communication.gateway'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus } from '../utils/data.utils'
import { runAfter } from '../utils/test.utils'
import { RecurrentPaymentJob, RecurrentPaymentNotificationJob } from './recurrent-payment.job'
import { RecurrentPaymentProcessor } from './recurrent-payment.processor'

describe('RecurrentPaymentProcessor', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let processor: RecurrentPaymentProcessor
    let sharedExpenseService: SharedExpenseService
    let context: TestingContext
    let pushService: PushNotificationService
    let emailService: EmailService
    let userService: UserService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        processor = app.get<RecurrentPaymentProcessor>(RecurrentPaymentProcessor)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        pushService = app.get<PushNotificationService>(PushNotificationService)
        emailService = app.get<EmailService>(EmailService)
        userService = app.get<UserService>(UserService)
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

    function createJobPayload(context: TestingContext): Job<RecurrentPaymentJob> {
        // @ts-ignore
        return {
            data: {
                sharedExpenseId: context.getSharedExpense().id,
                sharedExpenseUserAgreementId: context.getSharedExpenseUserAgreements()[0].id,
                uuid: context.getSharedExpenseUserAgreements()[0].uuid
            }
        }
    }

    describe('Creating transactions', () => {
        it("Should use the expense owner's account as the destination account and the payee's account as the source account for a transaction", async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })

            expect(transaction).not.toBeNull()
        })
        it('Should not create duplicate shared expense transaction records for a given scheduled date, payee, and expense owner', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            await processor.processRecurrentPayment(job)
            const transaction = await sharedExpenseService.findManyTransactionsBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })

            expect(transaction.length).toBe(1)
        })
        it('Should NOT charge a fee. Originally, the project was developed with the intent to charge a fee for transactions over $50.', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE, ExpenseContributionType.FIXED)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })

            expect(transaction.totalFeeAmount).toBe(0)
        })
        it('Should initiate a dwolla transfer between the parties involved', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })

            expect(transaction).not.toBeNull()
            expect(transaction.dwollaTransferUrl).not.toBeNull()
            expect(transaction.dwollaTransferId).not.toBeNull()
        })
        it('Should NOT (Dwolla already does this - revisit once we are off pay as you go) notify both the expense owner and the payee that the transaction was attempted', async () => {
            const spy = jest.spyOn(emailService, 'sendTransactionUpdate')
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE),
                context.withUserDevice,
                context.withPayeeDevice
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)

            const userDevice = context.getUserDevices().pop()
            const payeeDevice = context.getSecondaryUserDevices().pop()

            const userNotifications = await pushService.findWhere({ deviceId: userDevice.id })
            const payeeNotifications = await pushService.findWhere({ deviceId: payeeDevice.id })

            expect(userNotifications.length).toBe(1)
            expect(payeeNotifications.length).toBe(1)
            expect(spy.mock.calls.length).toBe(0)
        })
        it('Should send a websocket event to both participants when a transaction completes', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(2)
            })
        })
        it('Should set the dateTimeInitiated field for the sharedExpenseTransaction based on the date and time the transaction occurred', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
            const repository = app.get<Repository<SharedExpenseTransaction>>(
                getRepositoryToken(SharedExpenseTransaction)
            )
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            let transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })
            transaction.dateTimeInitiated = subDays(transaction.dateTimeInitiated, 1)
            await repository.save(transaction)
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.CREATED
            await processor.processRecurrentPayment(job)

            transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })
            expect(transaction.dateTimeInitiated.getTime()).toBeGreaterThan(subMinutes(new Date(), 1).getTime())
            expect(transaction.dateTimeInitiated.getTime()).toBeLessThan(addMinutes(new Date(), 1).getTime())
        })
    })

    describe('Calculating the amount of money that should be contributed by each party', () => {
        it('Should use the amount stated in the agreement', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const transaction = await sharedExpenseService.findTransactionBy({
                sourceAccountId: context.getSecondaryUsers()[0].id,
                destinationAccountId: context.getUser().id
            })
            const agreement = context.getSharedExpenseUserAgreements()[0]

            expect(transaction).not.toBeNull()
            expect(transaction.totalTransactionAmount).toBe(agreement.contributionValue)
        })
    })

    describe('Setting up the next expense date', () => {
        it('Should not set up the next payment if the transaction does not succeed', async () => {
            DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.BAD_REQUEST
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const expense = await sharedExpenseService.findSharedExpenseBy({ id: context.getSharedExpense().id })
            expect(expense.dateNextPaymentScheduled.getTime()).toBe(
                context.getSharedExpense().dateNextPaymentScheduled.getTime()
            )
        })
        it('Should calculate and set the date of the next transaction correctly for RecurringExpenseInterval.MONTHS', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            await context.updateSharedExpense((expense) => {
                expense.expenseRecurrenceInterval = RecurringExpenseInterval.MONTHS
                expense.expenseRecurrenceFrequency = 2
            })

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const expectedDate = addMonths(context.getSharedExpense().dateNextPaymentScheduled, 2)
            const expense = await sharedExpenseService.findSharedExpenseBy({ id: context.getSharedExpense().id })
            expect(expense.dateNextPaymentScheduled.getTime()).toBe(expectedDate.getTime())
        })
        it('Should calculate and set the date of the next transaction correctly for RecurringExpenseInterval.DAYS', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            await context.updateSharedExpense((expense) => {
                expense.expenseRecurrenceInterval = RecurringExpenseInterval.DAYS
                expense.expenseRecurrenceFrequency = 45
            })

            const job = createJobPayload(context)
            await processor.processRecurrentPayment(job)
            const expectedDate = addDays(context.getSharedExpense().dateNextPaymentScheduled, 45)
            const expense = await sharedExpenseService.findSharedExpenseBy({ id: context.getSharedExpense().id })
            expect(expense.dateNextPaymentScheduled.getTime()).toBe(expectedDate.getTime())
        })
        it('Should deactivate the expense and not schedule the next payment date if the next payment date is greater than the end date', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            await context.updateSharedExpense((expense) => {
                expense.expenseRecurrenceInterval = RecurringExpenseInterval.MONTHS
                expense.expenseRecurrenceFrequency = 2
                expense.recurringPaymentEndDate = addDays(new Date(), 1)
            })

            const job = createJobPayload(context)
            const sharedExpense = context.getSharedExpense()
            await processor.processRecurrentPayment(job)
            const expense = await sharedExpenseService.findSharedExpenseBy({ id: context.getSharedExpense().id })
            expect(expense.dateNextPaymentScheduled.getTime()).toBe(sharedExpense.dateNextPaymentScheduled.getTime())
            expect(expense.isActive).toBeFalsy()
        })
    })

    describe('Handling Plaid errors', () => {
        it("Should mark a user's account as requiring re-authentication with plaid when plaid throws an error with error code ITEM_LOGIN_REQUIRED", async () => {
            PlaidServiceFake.shouldThrowAuthError = true
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const job = createJobPayload(context)
            try {
                await processor.processRecurrentPayment(job)
            } catch (e) {}

            await runAfter(1000, async () => {
                const userAccountService = app.get<UserAccountService>(UserAccountService)
                const updatedAccount = await userAccountService.findOneWhere({
                    id: context.getSecondaryUserAccounts()[0].id
                })
                expect(updatedAccount.requiresPlaidReAuthentication).toBeTruthy()
            })
        })
        it('Should send a notification to both the payee and the recipient when the payee requires re-authentication', async () => {
            PlaidServiceFake.shouldThrowAuthError = true
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE),
                context.withUserDevice,
                context.withPayeeDevice
            )

            const job = createJobPayload(context)
            try {
                await processor.processRecurrentPayment(job)
            } catch (e) {}

            await runAfter(1000, async () => {
                const recipientDevice = context.getUserDevices()[0]
                const payerDevice = context.getSecondaryUserDevices()[0]
                const recipientNotifications = await pushService.findWhere({
                    deviceId: recipientDevice.id
                })
                const payerNotifications = await pushService.findWhere({
                    deviceId: payerDevice.id
                })

                expect(payerNotifications.length).toBe(1)
                expect(recipientNotifications.length).toBe(1)
            })
        })
        it('Should not send duplicate notifications for bank login re-authentication if one was sent within the past 2 hours', async () => {
            PlaidServiceFake.shouldThrowAuthError = true
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE),
                context.withUserDevice,
                context.withPayeeDevice
            )

            async function assertNotificationExpectations() {
                await runAfter(1000, async () => {
                    const recipientDevice = context.getUserDevices()[0]
                    const payerDevice = context.getSecondaryUserDevices()[0]
                    const recipientNotifications = await pushService.findWhere({
                        deviceId: recipientDevice.id
                    })
                    const payerNotifications = await pushService.findWhere({
                        deviceId: payerDevice.id
                    })

                    expect(payerNotifications.length).toBe(1)
                    expect(recipientNotifications.length).toBe(1)
                })
            }

            const job = createJobPayload(context)
            try {
                await processor.processRecurrentPayment(job)
            } catch (e) {}

            await assertNotificationExpectations()

            try {
                await processor.processRecurrentPayment(job)
            } catch (e) {}

            await assertNotificationExpectations()
        })
    })

    describe('Handling notifications', () => {
        it('Should send out the correct number of notifications', async () => {
            const spy = jest.spyOn(userService, 'sendPushNotificationAndEmail')
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            // @ts-ignore
            const job: Job<RecurrentPaymentNotificationJob> = {
                data: {
                    sharedExpenseId: context.getSharedExpense().id,
                    uuid: context.getSharedExpense().uuid
                }
            }
            await processor.processNotification(job)
            expect(spy.mock.calls.length).toBe(2)
        })
        it('Should avoid sending out notifications if the shared expense is canceled', async () => {
            const spy = jest.spyOn(userService, 'sendPushNotificationAndEmail')
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_INACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_INACTIVE)
            )

            // @ts-ignore
            const job: Job<RecurrentPaymentNotificationJob> = {
                data: {
                    sharedExpenseId: context.getSharedExpense().id,
                    uuid: context.getSharedExpense().uuid
                }
            }
            await processor.processNotification(job)
            expect(spy.mock.calls.length).toBe(0)
        })
    })
})
