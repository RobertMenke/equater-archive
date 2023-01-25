import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { DeviceService } from '../device/device.service'
import { ExpenseApiService } from '../expense_api/expense-api.service'
import { LoginLogService } from '../login_log/login-log.service'
import { TransactionService } from '../transaction/transaction.service'
import { RelationshipService } from '../user/relationship.service'
import { UserInviteService } from '../user/user-invite.service'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { AccountDeletionEvent } from './account-deletion.event'

/**
 * Starting June 30th, 2022, Apple is mandating that apps on their app store
 * provide users with the ability to delete all of their data in a given app.
 *
 * This is somewhat challenging for Equater, because shared bills and recurring
 * payments are inherently shared resources. The plan is to perform the following
 * actions:
 *
 * - Immediately delete any Dwolla or Plaid resources provisioned by the account
 *      - Plaid: remove all plaid items associated with the account
 *      - Dwolla: cancel any transfers in progress https://developers.dwolla.com/api-reference/transfers/cancel
 *      - Dwolla: remove all funding sources https://developers.dwolla.com/api-reference/funding-sources/remove
 * - Deactivate all shared bills/recurring payments
 *      - Deactivate all agreements/shared bills - replace the user/account ids with the placeholder deactivated account
 *      - Push notification/email to all participants letting them know the agreements were canceled due to a deactivated account
 *      -  In order, substitute the global deactivated user placeholder account for the user requesting deletion for these tables in order
 *          - `shared_expense_transaction`
 *          - `shared_expense_user_agreement`
 *          - `shared_expense` (only if the user in question created the shared expense)
 *      - Delete user account
 *          - IMPORTANT: move all `transaction`s to a dummy account dedicated as a placeholder for deleted accounts' transactions
 *      - Delete all `relationship` entries containing the user
 *      - Delete all `push_notifications` for the user
 *      - Delete all `user_devices` for the user
 *      - Delete all `user_invite` including the user
 *      - Delete all `login_log` entries for the user
 *      - Delete the `user`
 *      - Send the user an email confirming their account was deleted asking them to leave feedback
 *
 * @see https://developer.apple.com/news/?id=12m75xbj
 * @param request
 * @param id
 */
@EventsHandler(AccountDeletionEvent)
export class AccountDeletionHandler implements IEventHandler<AccountDeletionEvent> {
    constructor(
        private readonly expenseApiService: ExpenseApiService,
        private readonly userService: UserService,
        private readonly userAccountService: UserAccountService,
        private readonly deviceService: DeviceService,
        private readonly loginLogService: LoginLogService,
        private readonly userInviteService: UserInviteService,
        private readonly relationshipService: RelationshipService,
        private readonly transactionService: TransactionService
    ) {}

    async handle({ user }: AccountDeletionEvent): Promise<void> {
        await this.expenseApiService.deleteManagedResourcesForUser(user)
        await this.transactionService.deleteManagedResourcesForUser(user)
        await this.relationshipService.deleteManagedResourcesForUser(user)
        await this.deviceService.deleteManagedResourcesForUser(user)
        await this.userInviteService.deleteManagedResourcesForUser(user)
        await this.loginLogService.deleteManagedResourcesForUser(user)
        await this.userAccountService.deleteManagedResourcesForUser(user)
        await this.userService.deleteManagedResourcesForUser(user)
    }
}
