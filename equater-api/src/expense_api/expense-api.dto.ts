import { Type } from 'class-transformer'
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator'
import { ExpenseContribution } from '../shared_expense/shared-expense.dto'
import { RecurringExpenseInterval } from '../shared_expense/shared-expense.entity'

export class ExpenseSharingAgreementDto {
    // Account that money will be sent to for the shared expense owner
    // This is also the account that will be monitored for transactions
    // for shared merchant expenses.
    // This field can only reference a depository account.
    @IsInt()
    expenseOwnerDestinationAccountId: number

    // Expense sharing agreements can be initiated containing both active users
    // and users we've invited to the platform. [activeUsers] is an array of
    // user ids corresponding to users that are already on the platform.
    @IsObject()
    activeUsers: {
        [userId: number]: ExpenseContribution
    }

    // Expense sharing agreements can be initiated containing both active users
    // and users we've invited to the platform. [prospectiveUsers] is an array of
    // email addresses corresponding to users that should be invited to the platform.
    @IsObject()
    prospectiveUsers: {
        [email: string]: ExpenseContribution
    }

    // Name we'll be using to refer to this expense when we communicate with users
    @IsString()
    expenseNickName: string
}

export class CreateSharedBillDto extends ExpenseSharingAgreementDto {
    @IsInt()
    uniqueVendorId: number

    // The account used to detect a shared bill in the case that we're
    // matching this shared bill against a merchant in our database.
    // This field can reference a credit card or a depository account
    @IsInt()
    expenseOwnerSourceAccountId: number
}

export class CreateRecurringSharedExpenseDto extends ExpenseSharingAgreementDto {
    @IsInt()
    interval: RecurringExpenseInterval

    @IsInt()
    expenseFrequency: number

    @IsDateString()
    startDate: string

    @IsDateString()
    @IsOptional()
    endDate: string | null
}

export class UserAgreementDto {
    @IsInt()
    userAgreementId: number

    @IsBoolean()
    doesAcceptAgreement: boolean

    @IsOptional()
    @IsInt()
    paymentAccountId?: number
}

export class ItemStatusDto {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isPending?: boolean
}

export class SimulatedTransactionDto {
    @IsNumber()
    amount: number
}

export class SimulatedArbitraryTransactionDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsString()
    @IsNotEmpty()
    transactionName: string

    @IsString()
    @IsNotEmpty()
    merchantName: string

    @IsNumber()
    @IsNotEmpty()
    accountId: number

    @IsOptional()
    @IsString()
    ppdId: string | null
}
