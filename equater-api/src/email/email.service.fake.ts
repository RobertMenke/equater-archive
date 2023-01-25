import * as firebase from 'firebase-admin'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { UserInvite } from '../user/user-invite.entity'
import { User } from '../user/user.entity'

export class EmailServiceFake {
    sendEmailVerification(user: User) {
        return Promise.resolve()
    }

    sendPasswordResetLink(user: User) {
        return Promise.resolve()
    }

    sendUserInvite(invite: UserInvite) {
        return Promise.resolve()
    }

    sendNotificationEmail(user: User, notification: firebase.messaging.Notification) {
        return Promise.resolve()
    }

    sendAccountDeletionEmail(user: User) {
        return Promise.resolve()
    }

    sendInviteToParticipateInExpenseAgreementEmail(
        initiatingUser: User,
        invite: UserInvite,
        notification: firebase.messaging.Notification
    ) {
        return Promise.resolve()
    }

    sendExpenseAgreementUpdate(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        email: string,
        title: string,
        body: string
    ) {
        return Promise.resolve()
    }

    sendTransactionUpdate(
        expense: SharedExpense,
        transaction: SharedExpenseTransaction,
        email: string,
        title: string,
        body: string
    ) {
        return Promise.resolve()
    }

    sendIdentityVerificationEmail(user: User, message: string) {
        return Promise.resolve()
    }
}
