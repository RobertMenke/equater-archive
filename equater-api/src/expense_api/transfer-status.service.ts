import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { PushNotificationTag } from '../device/push-notification.service'
import { DwollaService } from '../dwolla/dwolla.service'
import { DwollaTransferStatus } from '../dwolla/dwolla.types'
import { EmailService } from '../email/email.service'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { UserService } from '../user/user.service'
import { logError } from '../utils/data.utils'

@Injectable()
export class TransferStatusService {
    private readonly logger = new Logger(TransferStatusService.name)

    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly configService: ConfigService,
        private readonly dwollaService: DwollaService,
        private readonly userService: UserService,
        private readonly emailService: EmailService
    ) {}

    async process(transaction: SharedExpenseTransaction) {
        try {
            this.logger.log(`Processing transaction status update ${transaction.id}`)
            const transferStatus = await this.dwollaService.getTransfer(transaction)
            transaction = await this.sharedExpenseService.syncTransactionStatus(transaction, transferStatus)

            if (transferStatus?.status === DwollaTransferStatus.PENDING) {
                return
            }

            if (transferStatus?.status === DwollaTransferStatus.FAILED) {
                this.logger.verbose(
                    `Transaction (with id ${transaction.id}) failed. Sending failed transaction notification.`
                )
                await this.sendFailedTransactionNotification(transaction)
            }

            return
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    private async sendFailedTransactionNotification(transaction: SharedExpenseTransaction) {
        const sharedExpense = await transaction.sharedExpense
        const sourceUser = await transaction.sourceUser
        const destinationUser = await transaction.destinationUser
        const title = `Unable to charge ${sourceUser.firstName}`
        const body = `We were unable to charge ${sourceUser.firstName} ${sourceUser.lastName} for ${sharedExpense.expenseNickName}.`
        await this.userService.sendPushNotification(
            destinationUser,
            PushNotificationTag.EXPENSE_TRANSACTION,
            {
                title,
                body
            },
            {
                sharedExpenseTransactionId: transaction.id.toString(10)
            }
        )
        await this.emailService.sendTransactionUpdate(sharedExpense, transaction, destinationUser.email, title, body)
    }
}
