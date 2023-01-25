import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientResponse } from '@sendgrid/client/src/response'
import * as sendgrid from '@sendgrid/mail'
import * as firebase from 'firebase-admin'
import { ConfigService, Environment } from '../config/config.service'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { UserInvite } from '../user/user-invite.entity'
import { User } from '../user/user.entity'

enum EmailTemplate {
    NOTIFICATION = 'd-16db0b53d5624733a2359c6de2240899',
    ACTION = 'd-4acb1a84b86e4509ad2ff223d26413fb',
    INVITATION = 'd-dbd7b78fe84649d9827c207f0f3973f8'
}

interface EmailNotificationTemplate {
    subject: string
    text_title: string
    text_body: string
}

interface EmailWithActionTemplate extends EmailNotificationTemplate {
    button_url: string
    button_text: string
    universal: string // 'true' or 'false'
}

interface EmailInvitationTemplate extends EmailNotificationTemplate {
    ios_store_link: string
    android_store_link: string
}

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name)
    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        sendgrid.setApiKey(this.configService.get(Environment.SENDGRID_API_KEY))
    }

    sendEmailVerification(user: User): Promise<[ClientResponse, {}]> {
        return this.sendAction(user.email, {
            subject: 'Equater - Please Verify Your Email',
            text_title: "Let's confirm your email address",
            text_body: 'By clicking on the following link, you are confirming your email address.',
            button_text: 'Confirm Email Address',
            button_url: `${this.configService.get(Environment.WEB_CLIENT)}/confirm-email/${user.emailVerificationCode}`,
            universal: 'false'
        })
    }

    sendPasswordResetLink(user: User): Promise<[ClientResponse, {}]> {
        return this.sendAction(user.email, {
            subject: 'Equater - Reset Your Password',
            text_title: 'Use the link below to reset your password',
            text_body:
                'This link expires after 1 use or 24 hours. If you did not request a password reset please contact support@equater.io.',
            button_text: 'Reset Your Password',
            button_url: `${this.configService.get(Environment.WEB_CLIENT)}/reset-password/${user.passwordResetCode}`,
            universal: 'false'
        })
    }

    sendUserInvite(userInitiatingInvite: User, invite: UserInvite): Promise<[ClientResponse, {}]> {
        this.logger.verbose('sendUserInvite')
        return this.sendInvitation(invite.email, {
            subject: `${userInitiatingInvite.firstName} ${userInitiatingInvite.lastName} Invited You To Join Equater`,
            text_title: `${userInitiatingInvite.firstName} wants you to join Equater`,
            text_body:
                'Equater makes it easy to share expenses or set up a recurring payment. Signing up is easy and secure! Tap the button below to download the app and get started.',
            //TODO: GET STORE LINKS
            ios_store_link: 'https://apple.co/3uvf4f5',
            android_store_link: 'https://equater.app'
        })
    }

    sendNotificationEmail(user: User, notification: firebase.messaging.Notification): Promise<[ClientResponse, {}]> {
        return this.sendNotification(user.email, {
            subject: 'Equater Notification',
            text_title: notification.title,
            text_body: notification.body
        })
    }

    sendAccountDeletionEmail(user: User): Promise<[ClientResponse, {}]> {
        return this.sendNotification(user.email, {
            subject: 'Equater Account Deleted',
            text_title: 'Your Equater account has been deleted',
            text_body: `We're sorry to see you go! It would really help us if you replied to this email letting us know why you chose to delete your account. Is there something we could have done better?`
        })
    }

    sendInviteToParticipateInExpenseAgreementEmail(
        initiatingUser: User,
        invite: UserInvite,
        notification: firebase.messaging.Notification
    ): Promise<[ClientResponse, {}]> {
        return this.sendInvitation(invite.email, {
            subject: `${initiatingUser.firstName} ${initiatingUser.lastName} Invited You To Join Equater`,
            text_title: notification.title,
            text_body: notification.body,
            //TODO: GET STORE LINKS
            ios_store_link: 'https://apple.co/3uvf4f5',
            android_store_link: 'https://equater.app'
        })
    }

    sendExpenseAgreementUpdate(
        expense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        email: string,
        title: string,
        body: string
    ): Promise<[ClientResponse, {}]> {
        return this.sendAction(email, {
            subject: expense.expenseNickName,
            text_title: title,
            text_body: body,
            button_text: 'Go To The App',
            button_url: `${this.configService.get(Environment.WEB_CLIENT)}/app/agreement/${expense.id}`,
            universal: 'true'
        })
    }

    sendTransactionUpdate(
        expense: SharedExpense,
        transaction: SharedExpenseTransaction,
        email: string,
        title: string,
        body: string
    ): Promise<[ClientResponse, {}]> {
        return this.sendAction(email, {
            subject: expense.expenseNickName,
            text_title: title,
            text_body: body,
            button_text: 'Go To The App',
            button_url: `${this.configService.get(Environment.WEB_CLIENT)}/app/transaction/${transaction.id}`,
            universal: 'true'
        })
    }

    sendIdentityVerificationEmail(user: User, title: string, message: string): Promise<[ClientResponse, {}]> {
        return this.sendAction(user.email, {
            subject: 'Equater - Action Required',
            text_title: title,
            text_body: message,
            button_text: 'Go To The App',
            button_url: `${this.configService.get(Environment.WEB_CLIENT)}/app/verify-identity`,
            universal: 'true'
        })
    }

    private sendNotification(email: string, data: EmailNotificationTemplate): Promise<[ClientResponse, {}]> {
        return sendgrid.send({
            to: email,
            from: this.configService.get(Environment.SENDGRID_FROM_ADDRESS),
            templateId: EmailTemplate.NOTIFICATION,
            hideWarnings: true,
            dynamicTemplateData: data
        })
    }

    private sendAction(email: string, data: EmailWithActionTemplate): Promise<[ClientResponse, {}]> {
        return sendgrid.send({
            to: email,
            from: this.configService.get(Environment.SENDGRID_FROM_ADDRESS),
            templateId: EmailTemplate.ACTION,
            hideWarnings: true,
            dynamicTemplateData: {
                ...data,
                universal: data.universal
            }
        })
    }

    private sendInvitation(email: string, data: EmailInvitationTemplate): Promise<[ClientResponse, {}]> {
        return sendgrid.send({
            to: email,
            from: this.configService.get(Environment.SENDGRID_FROM_ADDRESS),
            templateId: EmailTemplate.INVITATION,
            hideWarnings: true,
            dynamicTemplateData: data
        })
    }
}
