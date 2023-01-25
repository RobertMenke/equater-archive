import { User } from '../redux/slices/auth.slice'
import { Vendor } from '../redux/slices/transaction.slice'

export interface SharedExpense {
    id: number
    uniqueVendorId: number | null
    expenseOwnerUserId: number
    uuid: string
    expenseNickName: string
    dateTimeCreated: string //iso8601
    isActive: boolean
    isPending: boolean
    sharedExpenseType: SharedExpenseType
    expenseRecurrenceInterval: number | null
    expenseRecurrenceFrequency: number | null
    targetDateOfFirstCharge: string | null //iso8601
    dateLastCharged: string | null //iso8601
    dateNextPaymentScheduled: string | null //iso8601
    dateTimeDeactivated: string | null //iso8601
}

export interface SharedExpenseUserAgreement {
    id: number
    sharedExpenseId: number
    userId: number
    uuid: string
    contributionType: ExpenseContributionType
    contributionValue: number | null
    isPending: boolean
    isActive: boolean
    dateTimeCreated: string //iso8601
    dateTimeBecameActive: string | null //iso8601
    dateTimeBecameInactive: string | null //iso8601
}

export enum SharedExpenseType {
    TRANSACTION_WEB_HOOK = 0,
    RECURRING_DATE_AND_TIME = 1
}

export interface SharedExpenseStory {
    sharedExpense: SharedExpense
    initiatingUser: User
    vendor: Vendor | null
    agreements: SharedExpenseUserAgreement[]
    activeUsers: User[]
    prospectiveUsers: [UserInvite]
}

/**
 * User agreement story refers to all of the pieces of information needed to tell a user
 * the story of their expense agreement.
 *
 * e.g. "John Doe has requested that you pay X every time their charged by vendor Y"
 */
export interface UserAgreementStory extends SharedExpenseStory {
    userAgreement: SharedExpenseUserAgreement
}

export interface AgreementWatchlist {
    newAgreements: UserAgreementStory[]
    newAgreementsWithNewVendors: UserAgreementStory[]
}

export interface SharedExpenseTransaction {
    id: number
    uuid: string
    plaidTransactionId: number | null
    idempotencyToken: string
    hasBeenTransferredToDestination: boolean
    dateTimeTransferredToDestination: string | null //iso string
    dateTimeTransactionScheduled: string | null //iso string
    totalFeeAmount: number
    totalTransactionAmount: number
    sharedExpenseId: number
    sharedExpenseUserAgreementId: number
    destinationAccountId: number
    sourceAccountId: number
    destinationUserId: number
    sourceUserId: number
    dateTimeInitiated: string
    dwollaTransferUrl: string | null
    dwollaTransferId: string | null
    numberOfTimesAttempted: number
}

export interface TransactionStory {
    transaction: SharedExpenseTransaction
    vendor: Vendor | null
    payer: User
    recipient: User
    sharedExpense: SharedExpense
    sharedExpenseAgreement: SharedExpenseUserAgreement
}

enum ExpenseContributionType {
    PERCENTAGE = 0,
    FIXED = 1,
    SPLIT_EVENLY = 2
}

export interface UserInvite {
    id: number
    email: string
    uuid: string
    contributionType: ExpenseContributionType
    contributionValue: number | null
    dateTimeCreated: string //iso8601
    isConverted: boolean
    dateTimeBecameUser: string | null //iso8601
}
