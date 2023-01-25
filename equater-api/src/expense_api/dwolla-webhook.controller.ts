import { Body, Controller, Headers, Logger, Post, UseGuards } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { PoorMansPagerDutyService } from '../alerting/poor-mans-pager-duty.service'
import { DwollaWebhookPayload } from '../dwolla/dwolla-webhook-payload.dto'
import { DWOLLA_WEBHOOK_ENDPOINT, DwollaWebhookEvent } from '../dwolla/dwolla-webhook.event'
import { DwollaWebhookGuard } from '../guards/auth/dwolla-webhook.guard'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { UserSocketEvent } from '../socket/events/user-socket.event'
import { SocketEvent } from '../socket/socket.event'
import { UserService } from '../user/user.service'
import { TransferStatusService } from './transfer-status.service'

@Controller(DWOLLA_WEBHOOK_ENDPOINT)
@UseGuards(DwollaWebhookGuard)
export class DwollaWebhookController {
    private readonly logger = new Logger(DwollaWebhookController.name)

    constructor(
        private readonly alertService: PoorMansPagerDutyService,
        private readonly transferStatusService: TransferStatusService,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly userService: UserService,
        private readonly eventBus: EventBus
    ) {}

    /**
     * @link https://developers.dwolla.com/concepts/webhook-events#webhook-events
     * @param webhookType
     * @param body
     */
    @Post()
    async processWebhook(
        @Headers('x-dwolla-topic') webhookType: DwollaWebhookEvent,
        @Body() body: DwollaWebhookPayload
    ) {
        try {
            switch (webhookType) {
                //////////////////////////////
                // CUSTOMERS
                //////////////////////////////

                // No need to handle
                case DwollaWebhookEvent.CUSTOMER_CREATED:
                    break
                // Set dwollaReverificationNeeded to true - will prompt apps to
                case DwollaWebhookEvent.CUSTOMER_REVERIFICATION_NEEDED:
                    const user = await this.userService.findOneWhere({ dwollaCustomerId: body.resourceId })
                    if (!user) {
                        return
                    }
                    const updatedUser = await this.userService.setDwollaReverificationNeeded(user, true)
                    const serializedUser = await this.userService.serializeUser(updatedUser)
                    await this.eventBus.publish(
                        new UserSocketEvent(updatedUser, SocketEvent.USER_UPDATED, serializedUser)
                    )
                    this.sendWarningNotification(webhookType, body)
                    break
                case DwollaWebhookEvent.CUSTOMER_VERIFICATION_DOCUMENT_NEEDED:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break
                // No need to handle - we assume instant verification bc of the Dwolla/Plaid connection
                case DwollaWebhookEvent.CUSTOMER_VERIFIED:
                    break
                case DwollaWebhookEvent.CUSTOMER_SUSPENDED:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break
                // No need to handle
                case DwollaWebhookEvent.CUSTOMER_ACTIVATED:
                    break
                case DwollaWebhookEvent.CUSTOMER_DEACTIVATED:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break

                //////////////////////////////
                // FUNDING SOURCES
                //////////////////////////////

                // No need to handle
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_ADDED:
                    break
                // No need to handle
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_REMOVED:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break
                // No need to handle - we assume instant verification bc of the Dwolla/Plaid connection
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_VERIFIED:
                    break
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_UNVERIFIED:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_NEGATIVE:
                    this.sendNotificationForUnhandledEvent(webhookType, body)
                    break
                // No need to handle
                case DwollaWebhookEvent.CUSTOMER_FUNDING_SOURCE_UPDATED:
                    break

                //////////////////////////////
                // TRANSFERS
                //////////////////////////////

                case DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_CREATED:
                case DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_CANCELLED:
                case DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_FAILED:
                case DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_CREATION_FAILED:
                case DwollaWebhookEvent.CUSTOMER_BANK_TRANSFER_COMPLETED:
                case DwollaWebhookEvent.CUSTOMER_TRANSFER_CREATED:
                case DwollaWebhookEvent.CUSTOMER_TRANSFER_CANCELLED:
                case DwollaWebhookEvent.CUSTOMER_TRANSFER_FAILED:
                case DwollaWebhookEvent.CUSTOMER_TRANSFER_COMPLETED:
                    await this.updateSharedExpenseStatus(body)
                    break
                default:
                    this.logger.warn(`Unhandled Dwolla webhook ${webhookType} with payload ${JSON.stringify(body)}`)
            }
        } catch (e) {
            this.logger.error(`DWOLLA WEBHOOK ERROR -- ${e.message} -- ${JSON.stringify(body)}`)
            this.alertService.sendAlert(`DWOLLA WEBHOOK ERROR -- ${e.message}`)
        }
    }

    private async updateSharedExpenseStatus(body: DwollaWebhookPayload) {
        const transaction = await this.sharedExpenseService.findTransactionBy({
            dwollaTransferId: body.resourceId
        })

        if (!transaction) {
            return
        }

        const log = await this.sharedExpenseService.findTransactionEventLogBy({
            uuid: body.id
        })

        // Events can be sent multiple times, so this is our idempotency check
        if (log) {
            return
        }

        await this.sharedExpenseService.logTransactionEvent(transaction, body)
        await this.transferStatusService.process(transaction)
    }

    private sendNotificationForUnhandledEvent(event: DwollaWebhookEvent, body: DwollaWebhookPayload) {
        const message = `Unhandled Dwolla webhook, ${event} in reference to resource ${body.resourceId}.`
        this.logger.warn(`Unhandled Dwolla webhook ${event} with payload ${JSON.stringify(body)}`)

        this.alertService.sendAlert(message)
    }

    private sendWarningNotification(event: DwollaWebhookEvent, body: DwollaWebhookPayload) {
        const message = `Warning for Dwolla webhook, ${event} in reference to resource ${body.resourceId}.`
        this.logger.warn(`Unhandled Dwolla webhook ${event} with payload ${JSON.stringify(body)}`)

        this.alertService.sendAlert(message)
    }
}
