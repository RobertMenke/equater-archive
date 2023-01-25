import { NestExpressApplication } from '@nestjs/platform-express'
import { Repository } from 'typeorm'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { UserService } from '../user/user.service'
import { BinaryStatus, removeHoursMinutesSeconds } from '../utils/data.utils'
import { RECURRING_PAYMENT_SETTLEMENT_HOUR } from './expense-api.constants'
import { RecurrentPaymentCronService } from './recurrent-payment.cron.service'
import { addDays, subDays } from 'date-fns'
import { RecurrentPaymentProcessor } from './recurrent-payment.processor'

describe('RecurrentPaymentCronService', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let cronService: RecurrentPaymentCronService
    let userService: UserService
    let context: TestingContext

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        cronService = app.get<RecurrentPaymentCronService>(RecurrentPaymentCronService)
        userService = app.get<UserService>(UserService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        context = TestingContext.fromApp(app)
        // For this spec, the processor should never run
        RecurrentPaymentProcessor.SHOULD_HANDLE_JOBS = false
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    describe('Settling recurrent payments', () => {
        it('Should find recurrent payments that require processing', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const jobs = await cronService.queueRecurrentPayments()
            expect(jobs.length).toBe(1)
            expect(jobs[0].data.uuid).toBe(context.getSharedExpenseUserAgreements()[0].uuid)
        })
        it('Should not include payments that are not due for settlement', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, addDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const jobs = await cronService.queueRecurrentPayments()
            expect(jobs.length).toBe(0)
        })
        it('Should not include payments that are inactive', async () => {
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_INACTIVE),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_INACTIVE)
            )

            const jobs = await cronService.queueRecurrentPayments()
            expect(jobs.length).toBe(0)
        })
        it('Should create a single RecurrentPaymentJob per active shared expense user agreement', async () => {
            // Set up 3 payees, which should net 3 shared expense user agreements
            context = await context.chain(
                context.withPayee,
                context.withPayee,
                context.withPayee,
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, subDays(new Date(), 1)),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const jobs = await cronService.queueRecurrentPayments()
            expect(jobs.length).toBe(3)
            const ids = jobs.map((job) => job.data.uuid)
            context.getSharedExpenseUserAgreements().forEach((agreement) => {
                expect(ids.includes(agreement.uuid)).toBe(true)
            })
        })
    })

    describe('Notifications for recurrent payments', () => {
        it('Should find and notify payers and recipients that a payment is upcoming', async () => {
            const today = removeHoursMinutesSeconds(new Date())
            // If today is 9/2/2021 set the payment date for 9/3/2021 00:00:00
            // Be careful here, because this job could be running on 9/2/2021 at 11:59:59
            // and produce surprising results
            const paymentDate = addDays(today, 1)
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, paymentDate),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            // Payments are processed before notifications go out, so testing payments here is unnecessary
            const notificationJobs = await cronService.sendRemindersDayBefore()
            expect(notificationJobs.length).toBe(1)
        })
        it('Should not notify payers and recipients for payments that should have gone out yesterday', async () => {
            const paymentDate = subDays(new Date(), 1)
            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, paymentDate),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            // Payments are processed before notifications go out, so testing payments here is unnecessary
            const notificationJobs = await cronService.sendRemindersDayBefore()
            expect(notificationJobs.length).toBe(0)
        })
        it('Should not notify payers and recipients for payments that will go out more than 1 day from now', async () => {
            const nextPaymentCutoff = removeHoursMinutesSeconds(addDays(new Date(), 1))

            context = await context.chain(
                () => context.withRecurringPayment(BinaryStatus.IS_ACTIVE, nextPaymentCutoff),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            const expense = context.getSharedExpense()
            // @ts-ignore
            const date = new Date(Date.parse(expense.targetDateOfFirstCharge))
            date.setHours(RECURRING_PAYMENT_SETTLEMENT_HOUR + 1)
            expense.dateNextPaymentScheduled = date
            const repository = app.get<Repository<SharedExpense>>('SharedExpenseRepository')
            await repository.save(expense)

            // Payments are processed before notifications go out, so testing payments here is unnecessary
            const notificationJobs = await cronService.sendRemindersDayBefore()
            expect(notificationJobs.length).toBe(0)
        })
    })
})
