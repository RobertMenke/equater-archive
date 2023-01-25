import { InjectQueue } from '@nestjs/bull'
import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Logger,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { Queue } from 'bull'
import { Queues } from '../config/config.service'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { Roles, RolesGuard } from '../guards/auth/roles.guard'
import { EnvironmentGuard, ServerEnvironment } from '../guards/dev/environment.guard'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Role } from '../user/user.entity'
import { ExpenseApiService } from './expense-api.service'

// This controller is intended for devs to test things like notifications
// that go out via postman
@Controller('api/dev/expense')
@UseGuards(
    AuthenticationGuard,
    RolesGuard,
    new EnvironmentGuard([ServerEnvironment.DEVELOPMENT, ServerEnvironment.STAGING])
)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class ExpenseApiDevController {
    private readonly logger = new Logger(ExpenseApiDevController.name)

    constructor(
        @InjectQueue(Queues.RECURRENT_PAYMENTS)
        private readonly queue: Queue,
        private readonly expenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService
    ) {}

    @Post('notifications/agreement/:agreementId/owner')
    @Roles(Role.ADMIN)
    async sendAgreementNotificationToOwner(@Param('agreementId', new ParseIntPipe()) id: number) {
        const agreement = await this.expenseService.findAgreementBy({ id })
        const expense = await agreement.sharedExpense

        await this.expenseApiService.notifyExpenseOwnerOfAgreementStatus(expense, agreement)
    }

    @Post('notifications/agreement/:agreementId/payee')
    @Roles(Role.ADMIN)
    async sendAgreementNotificationToPayee(@Param('agreementId', new ParseIntPipe()) id: number) {
        const agreement = await this.expenseService.findAgreementBy({ id })
        const expense = await agreement.sharedExpense
        const user = await agreement.user

        await this.expenseApiService.notifyPayeeOfAgreementStatus(expense, agreement, user)
    }

    @Post('notifications/agreement-created/:agreementId/payee')
    @Roles(Role.ADMIN)
    async sendAgreementCreatedNotificationToPayee(@Param('agreementId', new ParseIntPipe()) id: number) {
        const agreement = await this.expenseService.findAgreementBy({ id })
        const expense = await agreement.sharedExpense

        await this.expenseApiService.notifyPayeeOfExpenseAgreementCreation(expense, agreement)
    }

    @Post('notifications/transaction/:transactionId/recipient')
    @Roles(Role.ADMIN)
    async sendTransactionNotificationToRecipient(@Param('transactionId', new ParseIntPipe()) id: number) {
        const transaction = await this.expenseService.findTransactionBy({ id })
        const agreement = await transaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense

        await this.expenseApiService.notifyExpenseOwnerOfTransactionAttempt(expense, agreement, transaction)
    }

    @Post('notifications/transaction/:transactionId/payee')
    @Roles(Role.ADMIN)
    async sendTransactionNotificationToPayee(@Param('transactionId', new ParseIntPipe()) id: number) {
        const transaction = await this.expenseService.findTransactionBy({ id })
        const agreement = await transaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense

        await this.expenseApiService.notifyPayeeOfTransactionAttempt(expense, agreement, transaction)
    }

    @Get('queues/recurrent-payment')
    @Roles(Role.ADMIN)
    async getQueueStatus() {
        const jobCount = await this.queue.getJobCounts()
        const jobs = this.queue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'])

        return {
            jobCount,
            jobs
        }
    }

    @Patch('queues/clear-recurrent-payment')
    @Roles(Role.ADMIN)
    async clearQueue() {
        await this.queue.clean(0, 'wait')
        await this.queue.clean(0, 'active')
        await this.queue.clean(0, 'completed')
        await this.queue.clean(0, 'failed')
        await this.queue.clean(0, 'delayed')
        this.logger.log(`========== Printing queue stats ==========`)
        this.logger.log(JSON.stringify(await this.queue.getJobCounts()))
        this.logger.log(`==========================================`)
    }
}
