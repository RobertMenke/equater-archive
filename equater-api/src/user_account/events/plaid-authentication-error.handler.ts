import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { In, MoreThan } from 'typeorm'
import { PushNotificationService, PushNotificationTag } from '../../device/push-notification.service'
import { PlaidLinkTokenService } from '../../plaid/plaid-link-token.service'
import { User } from '../../user/user.entity'
import { UserService } from '../../user/user.service'
import { UserAccountService } from '../user-account.service'
import { PlaidAuthenticationErrorEvent } from './plaid-authentication-error.event'
import { subHours } from 'date-fns'

const BANK_LOGIN_REQUIRED_PUSH_NOTIFICATION_TITLE = 'Bank Login Required'

@EventsHandler(PlaidAuthenticationErrorEvent)
export class PlaidAuthenticationErrorHandler implements IEventHandler<PlaidAuthenticationErrorEvent> {
    constructor(
        private readonly userService: UserService,
        private readonly userAccountService: UserAccountService,
        private readonly plaidLinkTokenService: PlaidLinkTokenService,
        private readonly pushNotificationService: PushNotificationService
    ) {}

    // Note that we'll handle creating a new plaid link token separately to avoid
    // creating one prematurely and then delivering an expired token to the end user
    async handle(event: PlaidAuthenticationErrorEvent) {
        const user = await event.userAccount.user
        const account = event.userAccount
        account.requiresPlaidReAuthentication = true
        await this.plaidLinkTokenService.updateItemUpdateTokenIfNecessary(user, account)
        await this.userAccountService.save(account)

        // If we've sent a notification to this user in the past 2 hours avoid
        // spamming them
        if (await this.hasSentRecentBankLoginNotification(user)) {
            return
        }

        await this.userService.sendPushNotificationAndEmail(user, PushNotificationTag.PLAID_AUTHENTICATION, {
            title: BANK_LOGIN_REQUIRED_PUSH_NOTIFICATION_TITLE,
            body: `Your bank has asked that you verify your login information again so that we can continue serving you.`
        })
        await this.notifyRecipient(event, user)
    }

    private async notifyRecipient(event: PlaidAuthenticationErrorEvent, payer: User) {
        const agreement = event.agreement

        if (!agreement) {
            return
        }

        const expense = await agreement.sharedExpense
        const recipient = await expense.user

        if (recipient.id !== event.userAccount.userId) {
            await this.userService.sendPushNotificationAndEmail(
                recipient,
                PushNotificationTag.EXPENSE_AGREEMENT,
                {
                    title: 'Transaction Failed',
                    body: `Failed to charge ${payer.firstName} because they need to re-link their account in the Equater app.`
                },
                {
                    sharedExpenseAgreementId: agreement.id.toString(10)
                }
            )
        }
    }

    /**
     * We will retry recurring payments on a 1-hour back-off, so we should only send
     * bank login notifications at most once every 2 hours.
     *
     * @param user
     * @private
     */
    private async hasSentRecentBankLoginNotification(user: User): Promise<boolean> {
        const userDevices = await user.devices
        const userDeviceIds = userDevices.map((device) => device.id)
        const cutoffDate = subHours(new Date(), 2)

        if (userDeviceIds.length === 0) {
            return false
        }

        const pastNotifications = await this.pushNotificationService.findWhere({
            deviceId: In(userDeviceIds),
            title: BANK_LOGIN_REQUIRED_PUSH_NOTIFICATION_TITLE,
            dateTimeAttempted: MoreThan(cutoffDate)
        })

        return pastNotifications.length > 0
    }
}
