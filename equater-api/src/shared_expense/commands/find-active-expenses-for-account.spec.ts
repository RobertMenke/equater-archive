import { CommandBus } from '@nestjs/cqrs'
import { NestExpressApplication } from '@nestjs/platform-express'
import { TestingContext } from '../../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../../setup.test'
import { BinaryStatus } from '../../utils/data.utils'
import { SharedExpense } from '../shared-expense.entity'
import { FindActiveExpensesForAccountCommand } from './find-active-expenses-for-account.command'
import { FindActiveExpensesForAccountHandler } from './find-active-expenses-for-account.handler'

describe(FindActiveExpensesForAccountHandler.name, () => {
    let app: NestExpressApplication
    let commandBus: CommandBus

    beforeAll(async () => {
        app = await setup()
        commandBus = app.get<CommandBus>(CommandBus)
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

    async function createActiveSharedBill(): Promise<TestingContext> {
        let context = TestingContext.fromApp(app)
        await context.chain(
            context.withUser,
            context.withPayee,
            context.withLinkedBankAccount,
            () => context.withSharedBill(BinaryStatus.IS_ACTIVE),
            () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
        )

        return context
    }

    async function createInactiveSharedBill(): Promise<TestingContext> {
        let context = TestingContext.fromApp(app)
        await context.chain(
            context.withUser,
            context.withPayee,
            context.withLinkedBankAccount,
            () => context.withSharedBill,
            () => context.withSharedExpenseUserAgreements
        )

        return context
    }

    it(`Should find active shared expenses when the user is the expense owner`, async () => {
        const context = await createActiveSharedBill()
        await context.withRecurringPayment(BinaryStatus.IS_ACTIVE)
        await context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)

        const response: SharedExpense[] = await commandBus.execute(
            new FindActiveExpensesForAccountCommand(context.getUserAccount())
        )
        expect(response.length).toBe(2)
    })
    it(`Should find active shared expenses when the user is the payee`, async () => {
        const context = await createActiveSharedBill()
        await context.withRecurringPayment(BinaryStatus.IS_ACTIVE)
        await context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)

        const response: SharedExpense[] = await commandBus.execute(
            new FindActiveExpensesForAccountCommand(context.getSecondaryUserAccounts()[0])
        )
        expect(response.length).toBe(2)
    })
    it(`Should not find any active shared expenses for inactive shared expenses when the user is the expense owner`, async () => {
        const context = await createInactiveSharedBill()
        await context.withRecurringPayment(BinaryStatus.IS_INACTIVE)
        await context.withSharedExpenseUserAgreements(BinaryStatus.IS_INACTIVE)

        const response: SharedExpense[] = await commandBus.execute(
            new FindActiveExpensesForAccountCommand(context.getUserAccount())
        )
        expect(response.length).toBe(0)
    })
    it(`Should not find any active shared expenses for inactive shared expenses when the user is the payee`, async () => {
        const context = await createInactiveSharedBill()
        await context.withRecurringPayment(BinaryStatus.IS_INACTIVE)
        await context.withSharedExpenseUserAgreements(BinaryStatus.IS_INACTIVE)

        const response: SharedExpense[] = await commandBus.execute(
            new FindActiveExpensesForAccountCommand(context.getSecondaryUserAccounts()[0])
        )
        expect(response.length).toBe(0)
    })
})
