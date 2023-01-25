import { IsNumber, IsString } from 'class-validator'

// Since multiple servers could be creating jobs at once and we're avoiding duplicate work
// with @nestjs/bull only look up shared expenses and agreements for jobs and let the actual
// processor create the transactions
export class RecurrentPaymentJob {
    @IsNumber()
    sharedExpenseId: number

    @IsNumber()
    sharedExpenseUserAgreementId: number

    @IsString()
    uuid: string
}

export class RecurrentPaymentNotificationJob {
    @IsNumber()
    sharedExpenseId: number

    @IsString()
    uuid: string
}
