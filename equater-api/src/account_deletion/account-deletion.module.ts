import { Module } from '@nestjs/common'
import { DeviceModule } from '../device/device.module'
import { ExpenseApiModule } from '../expense_api/expense-api.module'
import { SharedExpenseModule } from '../shared_expense/shared-expense.module'
import { TransactionModule } from '../transaction/transaction.module'
import { UserModule } from '../user/user.module'
import { AccountDeletionHandler } from './account-deletion.handler'

@Module({
    imports: [ExpenseApiModule, DeviceModule, UserModule, SharedExpenseModule, TransactionModule],
    providers: [AccountDeletionHandler]
})
export class AccountDeletionModule {}
