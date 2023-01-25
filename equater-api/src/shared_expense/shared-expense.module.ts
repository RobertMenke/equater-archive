import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionModule } from '../transaction/transaction.module'
import { UserModule } from '../user/user.module'
import { FindActiveExpensesForAccountHandler } from './commands/find-active-expenses-for-account.handler'
import { SharedExpenseTransactionLog } from './shared-expense-transaction-log.entity'
import { SharedExpenseUserAgreement } from './shared-expense-user-agreement.entity'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'
import { SharedExpenseWithheldTransaction } from './shared-expense-withheld-transaction.entity'
import { SharedExpense } from './shared-expense.entity'
import { SharedExpenseService } from './shared-expense.service'

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            SharedExpense,
            SharedExpenseUserAgreement,
            SharedExpenseTransaction,
            SharedExpenseWithheldTransaction,
            SharedExpenseTransactionLog
        ]),
        TransactionModule,
        UserModule,
        CqrsModule
    ],
    providers: [SharedExpenseService, FindActiveExpensesForAccountHandler],
    exports: [SharedExpenseService]
})
export class SharedExpenseModule {}
