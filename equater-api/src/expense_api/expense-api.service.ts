import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { In } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { PushNotificationTag } from '../device/push-notification.service'
import { DwollaService } from '../dwolla/dwolla.service'
import { DwollaTransferStatus } from '../dwolla/dwolla.types'
import { EmailService } from '../email/email.service'
import { PlaidService } from '../plaid/plaid.service'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpenseWithholdingReason } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { UserInvite } from '../user/user-invite.entity'
import { UserInviteService } from '../user/user-invite.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { formatListOfNames, logError, makeDinero, mapAsync } from '../utils/data.utils'
import { ExpenseSharingAgreementDto } from './expense-api.dto'

@Injectable()
export class ExpenseApiService implements DeletesManagedResources {
    private readonly logger = new Logger(ExpenseApiService.name)

    constructor(
        private readonly userService: UserService,
        private readonly userAccountService: UserAccountService,
        private readonly userInviteService: UserInviteService,
        private readonly expenseService: SharedExpenseService,
        private readonly emailService: EmailService,
        private readonly dwollaService: DwollaService,
        private readonly plaidService: PlaidService
    ) {}

    async sendUserInvites(userInitiatingInvite: User, sharedExpense: SharedExpense, dto: ExpenseSharingAgreementDto) {
        const emails = Object.keys(dto.prospectiveUsers)
        const invitedUsers = await mapAsync(emails, (email) => {
            const contribution = dto.prospectiveUsers[email]

            return this.userInviteService.createUserInvite(email, sharedExpense, contribution)
        })

        invitedUsers.forEach((invite) => {
            this.emailService.sendUserInvite(userInitiatingInvite, invite)
        })

        return invitedUsers
    }

    findPendingUserInvitesForExpense(sharedExpense: SharedExpense): Promise<UserInvite[]> {
        return this.userInviteService.getPendingInvitesByExpenseSharingAgreement(sharedExpense)
    }

    async createSharedExpenseUserAgreements(
        sharedExpense: SharedExpense,
        dto: ExpenseSharingAgreementDto
    ): Promise<SharedExpenseUserAgreement[]> {
        const userIds = Object.keys(dto.activeUsers).map(Number)
        return await mapAsync(userIds, async (id) => {
            const user = await this.userService.findOneWhere({ id })
            const contribution = dto.activeUsers[id]

            return await this.expenseService.createUserAgreement(sharedExpense, user, contribution)
        })
    }

    /**
     * @see UserController.permanentlyDeleteAccount
     * @param user
     */
    async deleteManagedResourcesForUser(user: User): Promise<void> {
        const placeholderUser = await this.userService.findPlaceholderUserReservedForDeletedAccountInfo()
        const placeholderAccount = await this.userAccountService.findPlaceholderAccountReservedForDeletedAccountInfo()
        // Find relevant entities
        const sharedExpenses = await this.expenseService.getSharedExpensesForUser(user)
        const activeSharedExpenses = sharedExpenses.filter((expense) => expense.isActive === true)
        const agreements = await this.expenseService.findManyAgreementsBy({
            sharedExpenseId: In(sharedExpenses.map((item) => item.id))
        })
        const transactions = await this.expenseService.findManyTransactionsBy({
            sharedExpenseId: In(sharedExpenses.map((item) => item.id))
        })

        // Cancel any pending transfers
        const pendingTransfers = transactions.filter(
            (transaction) => transaction.dwollaStatus === DwollaTransferStatus.PENDING
        )

        for (const transaction of pendingTransfers) {
            await this.dwollaService.cancelTransfer(transaction)
        }

        await this.expenseService.substitutePlaceholderUserForUserRequestingDeletionAndCancelAgreements(
            sharedExpenses,
            agreements,
            transactions,
            user,
            placeholderUser,
            placeholderAccount
        )

        // Every agreement needs to send out a notification. Always send to the agreement user
        // unless the agreement user deleted their account, then send to the expense owner.
        //
        // This is potentially very slow, but it doesn't really matter that much since it happens in the background
        // and it's expected to be a very infrequent event
        for (const expense of activeSharedExpenses) {
            const agreements = await this.expenseService.getUserAgreements(expense)
            for (const agreement of agreements) {
                const userToNotify = agreement.userId === placeholderUser.id ? await expense.user : await agreement.user
                this.notifyParticipantOfAgreementCancelationDueToAccountDeletion(
                    expense,
                    agreement,
                    userToNotify,
                    user
                ).catch((e) => this.logger.error(e.message))
            }
        }
    }

    /**
     *
     * @param expense
     * @param agreement
     * @param transaction
     */
    async notifyPayeeOfTransactionAttempt(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        transaction: SharedExpenseTransaction
    ) {
        const amount = makeDinero(transaction.totalTransactionAmount)
        const formattedAmount = amount.toFormat('$0,0.00')
        const expenseOwner = await expense.user
        let title: string
        let body: string

        if (transaction.dwollaTransferUrl) {
            title = `Payment Completed`
            body = `Your payment of ${formattedAmount} to ${expenseOwner.firstName} for ${expense.expenseNickName} was initiated successfully!`
        } else {
            title = `Payment Did Not Go Through`
            body = `Failed to send ${formattedAmount} ${expense.expenseNickName} for ${expense.expenseNickName}. We will try again tomorrow.`
        }

        const user = await agreement.user
        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_TRANSACTION,
            {
                title,
                body
            },
            {
                sharedExpenseTransactionId: transaction.id.toString(10)
            }
        )
        // For now, Dwolla handles the notification and we don't have any control over it
        // await this.emailService.sendTransactionUpdate(expense, transaction, user.email, title, body)
    }

    /**
     *
     * @param expense
     * @param agreement
     * @param transaction
     */
    async notifyExpenseOwnerOfTransactionAttempt(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        transaction: SharedExpenseTransaction
    ) {
        const amount = makeDinero(transaction.totalTransactionAmount)
        const formattedAmount = amount.toFormat('$0,0.00')
        const payee = await agreement.user
        let title: string
        let body: string

        if (transaction.dwollaTransferUrl) {
            title = `${payee.firstName} Sent You Money!`
            body = `${payee.firstName} just sent you ${formattedAmount} for ${expense.expenseNickName}!`
        } else {
            title = `Failed To Charge ${payee.firstName}`
            body = `Failed to charge ${payee.firstName} ${formattedAmount} for ${expense.expenseNickName}. We will try again tomorrow.`
        }

        const user = await expense.user
        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_TRANSACTION,
            {
                title,
                body
            },
            {
                sharedExpenseTransactionId: transaction.id.toString(10)
            }
        )
        // For now, Dwolla handles the notification and we don't have any control over it
        // await this.emailService.sendTransactionUpdate(expense, transaction, user.email, title, body)
    }

    async notifyPayeeOfExpenseAgreementCreation(expense: SharedExpense, agreement: SharedExpenseUserAgreement) {
        const user = await expense.user
        const payee = await agreement.user
        const badgeCount = await this.expenseService.countInvitationsForUser(payee)
        const title = `Shared Expense Request`
        const body = `${user.firstName} is requesting that you ${agreement.getAgreementDescription(
            expense.expenseNickName
        )}`

        await this.userService.sendPushNotificationWithBadge(
            payee,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title,
                body
            },
            badgeCount,
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: expense.id.toString(10),
                incrementInviteCounter: 'true'
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(expense, agreement, payee.email, title, body)
    }

    async notifyProspectiveUserOfExpenseAgreementCreation(expense: SharedExpense, invite: UserInvite) {
        const user = await expense.user
        const title = `Shared Expense Request`
        const body = `${user.firstName} is requesting that you ${invite.getAgreementDescription(
            expense.expenseNickName
        )}`

        await this.userService.sendInviteToParticipateInExpenseAgreementEmail(user, invite, {
            title,
            body
        })
    }

    /**
     *
     * @param expense
     * @param agreement
     */
    async notifyExpenseOwnerOfAgreementStatus(expense: SharedExpense, agreement: SharedExpenseUserAgreement) {
        const user = await expense.user
        const payee = await agreement.user
        const acceptedStatus = agreement.isActive ? 'accepted' : 'declined'
        let messageBody: string
        if (expense.uniqueVendorId) {
            const vendor = await expense.uniqueVendor
            messageBody = `${payee.firstName} has ${acceptedStatus} your request to share the cost of ${vendor.friendlyName}`
        } else {
            const description = expense.getExpenseFrequencyDescription()
            messageBody = `${payee.firstName} has ${acceptedStatus} your request to send money every ${description}`
        }

        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Expense Agreement',
                body: messageBody
            },
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: expense.id.toString(10)
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(
            expense,
            agreement,
            user.email,
            expense.expenseNickName,
            messageBody
        )
    }

    async notifyPayeeOfAgreementStatus(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        userInteractingWithAgreement: User
    ) {
        const expenseOwner = await expense.user
        const user = await agreement.user
        const messageName =
            user.id === userInteractingWithAgreement.id ? `you` : `${userInteractingWithAgreement.firstName}`
        const action = user.id === userInteractingWithAgreement.id ? `have` : `has`
        const acceptedStatus = agreement.isActive ? 'accepted' : 'declined'
        let messageBody: string
        if (expense.uniqueVendorId) {
            const vendor = await expense.uniqueVendor
            messageBody = `${messageName} ${action} ${acceptedStatus} ${expenseOwner.firstName}'s request to share the cost of ${vendor.friendlyName}`
        } else {
            const description = expense.getExpenseFrequencyDescription()
            messageBody = `${messageName} ${action} ${acceptedStatus} ${expenseOwner.firstName}'s request to send money every ${description}`
        }

        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Expense Agreement',
                body: messageBody
            },
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: expense.id.toString(10)
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(
            expense,
            agreement,
            user.email,
            expense.expenseNickName,
            messageBody
        )
    }

    /**
     * When a user permanently deletes their account we must notify all other participants
     * that their agreement has been canceled for this reason.
     *
     * @param sharedExpense
     * @param agreement
     * @param userToNotify
     * @param userThatDeletedTheirAccount
     */
    async notifyParticipantOfAgreementCancelationDueToAccountDeletion(
        sharedExpense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        userToNotify: User,
        userThatDeletedTheirAccount: User
    ): Promise<void> {
        const messageBody = `Your agreement, ${sharedExpense.expenseNickName}, has been canceled because ${userThatDeletedTheirAccount.firstName} deleted their Equater account.`
        await this.userService.sendPushNotification(
            userToNotify,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Agreement Canceled',
                body: messageBody
            },
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: sharedExpense.id.toString(10)
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(
            sharedExpense,
            agreement,
            userToNotify.email,
            sharedExpense.expenseNickName,
            messageBody
        )
    }

    /**
     * Let relevant people know what the status is of an individual agreement
     *
     * @param expense
     * @param agreements
     * @param userInteractingWithAgreement
     */
    async sendAgreementStatusNotification(
        expense: SharedExpense,
        agreements: SharedExpenseUserAgreement[],
        userInteractingWithAgreement: User
    ) {
        const updatedAgreement = agreements.find((agreement) => agreement.userId === userInteractingWithAgreement.id)

        if (updatedAgreement) {
            await this.notifyExpenseOwnerOfAgreementStatus(expense, updatedAgreement)
        }

        agreements.forEach((agreement) => {
            this.notifyPayeeOfAgreementStatus(expense, agreement, userInteractingWithAgreement).catch((err) =>
                logError(this.logger, err)
            )
        })
    }

    /**
     * Let relevant people know what the status of the overall shared expense is
     *
     * @param expense
     * @param agreements
     * @param userInteractingWithAgreement
     */
    async sendExpenseStatusNotification(
        expense: SharedExpense,
        agreements: SharedExpenseUserAgreement[],
        userInteractingWithAgreement: User
    ) {
        const updatedAgreement = agreements.find((agreement) => agreement.userId === userInteractingWithAgreement.id)

        if (updatedAgreement) {
            await this.notifyExpenseOwnerOfExpenseStatus(expense, updatedAgreement)
        }

        agreements.forEach((agreement) => {
            this.notifyPayeesOfExpenseStatus(expense, agreement, userInteractingWithAgreement)
        })
    }

    async notifyExpenseOwnerOfExpenseStatus(expense: SharedExpense, agreement: SharedExpenseUserAgreement = null) {
        const user = await expense.user
        const payee = await agreement.user
        const activeStatus = expense.isActive ? 'active' : 'inactive'
        const acceptedStatus = expense.isActive ? 'accepted' : 'declined'
        const messageBody = `Your expense agreement, ${expense.expenseNickName}, is now ${activeStatus} after ${payee.firstName} ${acceptedStatus} the agreement.`

        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Shared Expense',
                body: messageBody
            },
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: expense.id.toString(10)
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(
            expense,
            agreement,
            user.email,
            expense.expenseNickName,
            messageBody
        )
    }

    async sendExpenseCancellationNotices(expense: SharedExpense, userThatCancelled: User) {
        const expenseOwner = await expense.user
        const agreements = await expense.userAgreements
        const agreementUsers = await mapAsync(agreements, async (agreement) => await agreement.user)
        const users = agreementUsers.concat([expenseOwner])

        for (const user of users) {
            const name = user.id === userThatCancelled.id ? 'you' : userThatCancelled.firstName
            const message = `Your expense agreement, ${expense.expenseNickName}, is now canceled after ${name} canceled the agreement.`
            await this.userService.sendPushNotification(
                user,
                PushNotificationTag.EXPENSE_CANCELLATION,
                {
                    title: 'Shared Expense',
                    body: message
                },
                {
                    sharedExpenseId: expense.id.toString(10)
                }
            )
            await this.emailService.sendNotificationEmail(user, {
                title: `Your agreement, ${expense.expenseNickName} has been cancelled`,
                body: message
            })
        }
    }

    async notifyPayeesOfExpenseStatus(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        userInteractingWithAgreement: User
    ) {
        const user = await agreement.user
        const messageName =
            user.id === userInteractingWithAgreement.id ? `you` : `${userInteractingWithAgreement.firstName}`
        const activeStatus = expense.isActive ? 'active' : 'inactive'
        const acceptedStatus = expense.isActive ? 'accepted' : 'declined'
        const messageBody = `Your agreement, ${expense.expenseNickName}, is now ${activeStatus} after ${messageName} ${acceptedStatus} the agreement.`

        await this.userService.sendPushNotification(
            user,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Shared Expense',
                body: messageBody
            },
            {
                sharedExpenseAgreementId: agreement.id.toString(10),
                sharedExpenseId: expense.id.toString(10)
            }
        )
        await this.emailService.sendExpenseAgreementUpdate(
            expense,
            agreement,
            user.email,
            expense.expenseNickName,
            messageBody
        )
    }

    // TODO: This existed early in development when we didn't prompt all users for identity verification
    // TODO: This can be safely removed
    async notifyDestinationAboutIdentityVerification(
        sourceUser: User,
        destinationUser: User,
        expense: SharedExpense,
        transaction: SharedExpenseTransaction
    ) {
        const totalTransactionAmount = makeDinero(transaction.totalTransactionAmount)
        const message = `${sourceUser.firstName} received a refund related to your shared expense, ${
            expense.expenseNickName
        }, and we tried to send you your share (${totalTransactionAmount.toFormat(
            '$0,0.00'
        )}).We need you to verify your identity first via the "Identity Verification" form in your Equater app.`

        await this.userService.sendPushNotification(destinationUser, PushNotificationTag.IDENTITY_VERIFICATION, {
            title: 'Action Required',
            body: message
        })
        const title = `${sourceUser.firstName} received a refund`
        await this.emailService.sendIdentityVerificationEmail(destinationUser, title, message)
    }

    async notifySourceAboutIdentityVerification(
        sourceUser: User,
        destinationUser: User,
        expense: SharedExpense,
        transaction: SharedExpenseTransaction
    ) {
        const totalTransactionAmount = makeDinero(transaction.totalTransactionAmount)
        const message = `We detected that you received a refund related to your shared expense, ${
            expense.expenseNickName
        }. We tried sending ${destinationUser.firstName} their portion of the refund (${totalTransactionAmount.toFormat(
            '$0,0.00'
        )}) but need them to fill out the identity verification form. We've sent them a notification and will try again tomorrow.`

        await this.userService.sendPushNotificationAndEmail(sourceUser, PushNotificationTag.NOTIFICATION, {
            title: 'About Your Refund',
            body: message
        })
    }

    /**
     * This sends out a reminder the day before the expense is due so that the payer(s) or recipient
     * has a chance to make any modifications
     *
     * @param sharedExpense
     */
    async sendRecurringExpenseReminders(sharedExpense: SharedExpense) {
        await this.sendRecurringExpenseReminderToRecipient(sharedExpense)
        await this.sendRecurringExpenseReminderToPayers(sharedExpense)
    }

    private async sendRecurringExpenseReminderToRecipient(sharedExpense: SharedExpense) {
        const recipient = await sharedExpense.user
        const agreements = await sharedExpense.userAgreements
        const payers = await mapAsync(agreements, async (agreement) => await agreement.user)
        const payerNames = formatListOfNames(payers.map((value) => value.firstName))

        const total = agreements.reduce((acc, value) => {
            return acc.add(makeDinero(value.contributionValue))
        }, makeDinero(0))

        const totalFormatted = total.toFormat('$0,0.00')
        await this.userService.sendPushNotificationAndEmail(
            recipient,
            PushNotificationTag.EXPENSE_AGREEMENT,
            {
                title: 'Payment Reminder',
                body: `Tomorrow you will receive ${totalFormatted} from ${payerNames}`
            },
            {
                sharedExpenseAgreementId: agreements[0].id.toString(10),
                sharedExpenseId: sharedExpense.id.toString(10)
            }
        )
    }

    private async sendRecurringExpenseReminderToPayers(sharedExpense: SharedExpense) {
        const recipient = await sharedExpense.user
        const agreements = await sharedExpense.userAgreements
        for (const agreement of agreements) {
            const payer = await agreement.user
            const total = makeDinero(agreement.contributionValue)
            const totalFormatted = total.toFormat('$0,0.00')
            await this.userService.sendPushNotificationAndEmail(
                payer,
                PushNotificationTag.EXPENSE_AGREEMENT,
                {
                    title: 'Payment Reminder',
                    body: `Tomorrow you will pay ${totalFormatted} to ${recipient.firstName}`
                },
                {
                    sharedExpenseAgreementId: agreement.id.toString(10),
                    sharedExpenseId: sharedExpense.id.toString(10)
                }
            )
        }
    }

    async createTransferFromTransaction(transaction: SharedExpenseTransaction): Promise<SharedExpenseTransaction> {
        const agreement = await transaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense

        return await this.createTransferOfFunds(expense, agreement, transaction)
    }

    /**
     * @param sharedExpense
     * @param sharedExpenseUserAgreement
     * @param sharedExpenseTransaction
     * @param plaidTransaction
     */
    async createTransferOfFunds(
        sharedExpense: SharedExpense,
        sharedExpenseUserAgreement: SharedExpenseUserAgreement,
        sharedExpenseTransaction: SharedExpenseTransaction,
        plaidTransaction: Transaction = null
    ): Promise<SharedExpenseTransaction> {
        const sourceUser = await sharedExpenseTransaction.sourceUser
        const destinationUser = await sharedExpenseTransaction.destinationUser
        const sourceAccount = await sharedExpenseTransaction.sourceAccount
        const destinationAccount = await sharedExpenseTransaction.destinationAccount
        const availableFunds = await this.plaidService.getAvailableBalance(sourceAccount, sharedExpenseUserAgreement)
        const totalTransactionAmount = makeDinero(Math.abs(sharedExpenseTransaction.totalTransactionAmount))
        const totalFeeAmount = makeDinero(sharedExpenseTransaction.totalFeeAmount)

        // All errors are handled the same way - increment attempts and log the withheld expense
        const handleError = async (reason: SharedExpenseWithholdingReason, err: string) => {
            this.logger.error(`Error in ExpenseApiService.createTransferOfFunds ${err}`)
            await this.expenseService.createWithheldExpense(
                sharedExpense,
                sharedExpenseUserAgreement,
                sharedExpenseTransaction,
                availableFunds,
                makeDinero(sharedExpenseTransaction.totalTransactionAmount),
                plaidTransaction,
                reason
            )

            return await this.expenseService.incrementTransactionAttempts(sharedExpenseTransaction)
        }

        try {
            if (!availableFunds) {
                this.logger.warn(`Real time balance info is not available. Marking transaction as withheld.`)
                return await handleError(
                    SharedExpenseWithholdingReason.UNABLE_TO_GET_REAL_TIME_BALANCE,
                    `Unable to retrieve a real-time balance for account id ${sourceAccount.id}. Marking transaction as withheld`
                )
            }

            if (availableFunds.lessThan(totalTransactionAmount.add(totalFeeAmount))) {
                return await handleError(
                    SharedExpenseWithholdingReason.INSUFFICIENT_FUNDS,
                    `Insufficient funds: ${availableFunds.getAmount()}, owed: ${totalTransactionAmount.getAmount()} fee: ${totalFeeAmount.getAmount()}`
                )
            }

            const response = await this.dwollaService.createTransfer(
                sourceUser,
                destinationUser,
                sourceAccount,
                destinationAccount,
                sharedExpenseTransaction
            )
            switch (response.status) {
                case HttpStatus.CREATED:
                    await this.expenseService.markWithheldTransactionsAsSettled(sharedExpenseTransaction)

                    return await this.expenseService.handleSuccessfulDwollaTransfer(sharedExpenseTransaction, response)
                case HttpStatus.BAD_REQUEST:
                    return await handleError(
                        SharedExpenseWithholdingReason.INVALID_FUNDING_SOURCE,
                        (await response.body) as string
                    )
                case HttpStatus.UNAUTHORIZED:
                    return await handleError(
                        SharedExpenseWithholdingReason.INVALID_ACCESS_TOKEN,
                        (await response.body) as string
                    )
                case HttpStatus.FORBIDDEN:
                    return await handleError(SharedExpenseWithholdingReason.FORBIDDEN, (await response.body) as string)
                default:
                    return await handleError(SharedExpenseWithholdingReason.UNKNOWN, (await response.body) as string)
            }
        } catch (err) {
            return await handleError(SharedExpenseWithholdingReason.UNKNOWN, err.message)
        }
    }
}
