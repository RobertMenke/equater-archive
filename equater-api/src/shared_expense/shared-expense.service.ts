import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { instanceToPlain } from 'class-transformer'
import { addDays, addMonths, subDays } from 'date-fns'
import * as Dinero from 'dinero.js'
import { Response } from 'dwolla-v2'
import { Between, Brackets, Equal, FindOptionsWhere, In, LessThan, LessThanOrEqual, Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { DwollaWebhookPayload } from '../dwolla/dwolla-webhook-payload.dto'
import { DwollaTransfer, DwollaTransferStatus } from '../dwolla/dwolla.types'
import { RECURRING_PAYMENT_SETTLEMENT_HOUR } from '../expense_api/expense-api.constants'
import { CreateRecurringSharedExpenseDto, CreateSharedBillDto, ItemStatusDto } from '../expense_api/expense-api.dto'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { TransactionUpdateEvent } from '../socket/events/transaction-update.event'
import { UserSocketEvent } from '../socket/events/user-socket.event'
import { SocketEvent } from '../socket/socket.event'
import { Transaction } from '../transaction/transaction.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { UserInvite } from '../user/user-invite.entity'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import {
    BinaryStatus,
    makeDinero,
    mapAsync,
    removeDuplicatesWithSelector,
    removeHoursMinutesSeconds
} from '../utils/data.utils'
import { SharedExpenseTransactionLog } from './shared-expense-transaction-log.entity'
import { SharedExpenseTransaction } from './shared-expense-transaction.entity'
import { ExpenseContributionType, SharedExpenseUserAgreement } from './shared-expense-user-agreement.entity'
import {
    SharedExpenseWithheldTransaction,
    SharedExpenseWithholdingReason
} from './shared-expense-withheld-transaction.entity'
import { ExpenseContribution } from './shared-expense.dto'
import { RecurringExpenseInterval, SharedExpense, SharedExpenseType } from './shared-expense.entity'

export interface SharedExpenseStory {
    sharedExpense: SharedExpense
    initiatingUser: User
    vendor: UniqueVendor | null
    agreements: SharedExpenseUserAgreement[]
    activeUsers: User[]
    prospectiveUsers: UserInvite[]
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

/**
 * Represents the data necessary for a transaction summary card
 */
export interface TransactionStory {
    transaction: SharedExpenseTransaction
    vendor: UniqueVendor | null
    payer: User
    recipient: User
    sharedExpense: SharedExpense
    sharedExpenseAgreement: SharedExpenseUserAgreement
}

@Injectable()
export class SharedExpenseService {
    private readonly logger = new Logger(SharedExpenseService.name)
    constructor(
        @InjectRepository(SharedExpense)
        private readonly sharedExpenseRepository: Repository<SharedExpense>,
        @InjectRepository(SharedExpenseUserAgreement)
        private readonly userAgreementRepository: Repository<SharedExpenseUserAgreement>,
        @InjectRepository(SharedExpenseTransaction)
        private readonly transactionRepository: Repository<SharedExpenseTransaction>,
        @InjectRepository(SharedExpenseWithheldTransaction)
        private readonly withheldTransactionRepository: Repository<SharedExpenseWithheldTransaction>,
        @InjectRepository(SharedExpenseTransactionLog)
        private readonly transactionLogRepository: Repository<SharedExpenseTransactionLog>,
        private readonly vendorService: VendorService,
        private readonly userService: UserService,
        private readonly userAccountService: UserAccountService,
        private readonly eventBus: EventBus,
        private readonly plaidLinkTokenService: PlaidLinkTokenService
    ) {}

    findSharedExpenseBy(options: FindOptionsWhere<SharedExpense>) {
        return this.sharedExpenseRepository.findOne({
            where: options
        })
    }

    findAgreementBy(options: FindOptionsWhere<SharedExpenseUserAgreement>) {
        return this.userAgreementRepository.findOne({
            where: options
        })
    }

    findManyAgreementsBy(options: FindOptionsWhere<SharedExpenseUserAgreement>) {
        return this.userAgreementRepository.find({
            where: options
        })
    }

    findTransactionBy(options: FindOptionsWhere<SharedExpenseTransaction>) {
        return this.transactionRepository.findOne({
            where: options
        })
    }

    findManyTransactionsBy(
        options: FindOptionsWhere<SharedExpenseTransaction> | FindOptionsWhere<SharedExpenseTransaction>[]
    ) {
        return this.transactionRepository.find({
            where: options
        })
    }

    findWithheldTransactionBy(options: FindOptionsWhere<SharedExpenseWithheldTransaction>) {
        return this.withheldTransactionRepository.findOne({
            where: options
        })
    }

    findManyWithheldTransactionsBy(options: FindOptionsWhere<SharedExpenseWithheldTransaction>) {
        return this.withheldTransactionRepository.find({
            where: options
        })
    }

    findTransactionEventLogBy(
        options: FindOptionsWhere<SharedExpenseTransactionLog>
    ): Promise<SharedExpenseTransactionLog | null> {
        return this.transactionLogRepository.findOne({
            where: options
        })
    }

    findTransactionsEventLogsBy(
        options: FindOptionsWhere<SharedExpenseTransactionLog>
    ): Promise<SharedExpenseTransactionLog[]> {
        return this.transactionLogRepository.find({
            where: options
        })
    }

    /**
     * 1 additional complexity here is that we can receive the id for a vendor like
     * "TRG Management Group", the biller, but what the user has agreed to split is
     * from a subsidiary like "Icon Central".
     *
     * @param user
     * @param vendors
     */
    async findSharedExpensesMatchingVendor(user: User, vendors: number[]): Promise<SharedExpense[]> {
        const allPossibleVendors = await this.vendorService.createVendorIdListIncludingAssociations(vendors)

        if (allPossibleVendors.length === 0) {
            return []
        }

        return this.sharedExpenseRepository.find({
            where: {
                expenseOwnerUserId: user.id,
                uniqueVendorId: In(allPossibleVendors),
                isActive: true
            }
        })
    }

    countInvitationsForUser(user: User): Promise<number> {
        return this.userAgreementRepository.count({
            where: {
                userId: user.id,
                isActive: false,
                isPending: true
            }
        })
    }

    findRecurringPaymentsThatShouldBeSettled() {
        this.logger.log(
            `Finding recurring payments that should whose next charge date is less than ${new Date().toString()}`
        )
        return this.sharedExpenseRepository.find({
            where: {
                sharedExpenseType: SharedExpenseType.RECURRING_PAYMENT,
                isActive: true,
                dateNextPaymentScheduled: LessThanOrEqual(new Date())
            }
        })
    }

    findRecurringExpensesThatWillBeSettledTomorrow() {
        const currentPaymentCutoff = new Date()
        // This is coupled to a job the runs exactly 1 hour after the recurring payment cron job
        const nextPaymentCutoff = removeHoursMinutesSeconds(addDays(new Date(), 1))
        nextPaymentCutoff.setHours(RECURRING_PAYMENT_SETTLEMENT_HOUR)
        this.logger.log(
            `Finding payments that will be processed before ${nextPaymentCutoff.toString()} in order to send reminders`
        )

        return this.sharedExpenseRepository.find({
            where: {
                sharedExpenseType: SharedExpenseType.RECURRING_PAYMENT,
                isActive: true,
                dateNextPaymentScheduled: Between(currentPaymentCutoff, nextPaymentCutoff)
            }
        })
    }

    async findWithheldPaymentsThatShouldBeSettled() {
        const transactions = await this.withheldTransactionRepository.find({
            where: {
                // Ensures that at least 24 hours have passed since the last attempt
                dateTimeAttempted: LessThan(subDays(new Date(), 1)),
                hasBeenReconciled: false
            }
        })

        // Make sure we're only retrying a given transaction 1 time
        return removeDuplicatesWithSelector<SharedExpenseWithheldTransaction, number>(
            transactions,
            (transaction) => transaction.sharedExpenseTransactionId
        )
    }

    /**
     * Note that by default a shared expense is not active until its been agreed upon
     * by all users involved
     *
     * @param user
     * @param vendor
     * @param dto
     */
    createSharedBill(user: User, vendor: UniqueVendor, dto: CreateSharedBillDto): Promise<SharedExpense> {
        const expense = new SharedExpense({
            sharedExpenseType: SharedExpenseType.SHARED_BILL,
            expenseNickName: dto.expenseNickName,
            dateTimeCreated: new Date(),
            isActive: false,
            isPending: true,
            uniqueVendorId: vendor.id,
            expenseOwnerUserId: user.id,
            expenseOwnerDestinationAccountId: dto.expenseOwnerDestinationAccountId,
            expenseOwnerSourceAccountId: dto.expenseOwnerSourceAccountId
        })

        return this.sharedExpenseRepository.save(expense)
    }

    createRecurringDateAgreement(user: User, dto: CreateRecurringSharedExpenseDto) {
        const startDate = removeHoursMinutesSeconds(new Date(Date.parse(dto.startDate)))
        const endDate = dto.endDate ? removeHoursMinutesSeconds(new Date(Date.parse(dto.endDate))) : null

        const expense = new SharedExpense({
            sharedExpenseType: SharedExpenseType.RECURRING_PAYMENT,
            expenseNickName: dto.expenseNickName,
            dateTimeCreated: new Date(),
            expenseOwnerUserId: user.id,
            isActive: false,
            isPending: true,
            expenseRecurrenceInterval: dto.interval,
            expenseRecurrenceFrequency: dto.expenseFrequency,
            targetDateOfFirstCharge: startDate,
            dateNextPaymentScheduled: startDate,
            recurringPaymentEndDate: endDate,
            expenseOwnerDestinationAccountId: dto.expenseOwnerDestinationAccountId,
            // Don't technically need this field populated for recurring expenses, but just for
            // consistency I'm going to keep it the same as the destination account for now
            expenseOwnerSourceAccountId: dto.expenseOwnerDestinationAccountId
        })

        return this.sharedExpenseRepository.save(expense)
    }

    /**
     * Assuming for now that when a status change occurs in a shared expense that
     * isPending will be false because it's been acted upon. This is definitely subject
     * to change.
     *
     * @param expense
     * @param status
     */
    setSharedExpenseStatus(expense: SharedExpense, status: BinaryStatus): Promise<SharedExpense> {
        expense.isActive = status === BinaryStatus.IS_ACTIVE
        expense.isPending = false

        if (status === BinaryStatus.IS_INACTIVE) {
            expense.dateTimeDeactivated = new Date()
        }

        return this.sharedExpenseRepository.save(expense)
    }

    createUserAgreement(
        expense: SharedExpense,
        user: User,
        contribution: ExpenseContribution
    ): Promise<SharedExpenseUserAgreement> {
        const entity = new SharedExpenseUserAgreement({
            userId: user.id,
            sharedExpenseId: expense.id,
            contributionType: contribution.contributionType,
            contributionValue: contribution.contributionValue,
            isPending: true,
            isActive: false,
            dateTimeCreated: new Date()
        })

        return this.userAgreementRepository.save(entity)
    }

    createWithheldExpense(
        sharedExpense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        transaction: SharedExpenseTransaction,
        fundsAvailable: Dinero.Dinero,
        contributionValue: Dinero.Dinero,
        plaidTransaction: Transaction = null,
        withholdingReason: SharedExpenseWithholdingReason = SharedExpenseWithholdingReason.INSUFFICIENT_FUNDS
    ) {
        const entity = new SharedExpenseWithheldTransaction({
            sharedExpenseUserAgreementId: agreement.id,
            sharedExpenseTransactionId: transaction.id,
            plaidTransactionId: plaidTransaction ? plaidTransaction.id : null,
            withholdingReason: withholdingReason,
            fundsAvailableAtTimeOfAttemptedTransaction: fundsAvailable.getAmount(),
            totalContributionAmount: contributionValue.getAmount(),
            dateTimeOriginalPaymentScheduled: sharedExpense.dateNextPaymentScheduled
        })

        return this.withheldTransactionRepository.save(entity)
    }

    async findOrCreateRecurringPaymentTransaction(
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        destinationUser: User,
        destinationAccount: UserAccount,
        sourceUser: User,
        sourceAccount: UserAccount,
        totalFeeAmount: Dinero.Dinero,
        totalOwedAmount: Dinero.Dinero
    ) {
        const entity = await this.findTransactionBy({
            sharedExpenseId: sharedExpense.id,
            sharedExpenseUserAgreementId: userAgreement.id,
            sourceAccountId: sourceAccount.id,
            destinationAccountId: destinationAccount.id,
            dateTimeTransactionScheduled: Equal(sharedExpense.dateNextPaymentScheduled)
        })

        if (entity) {
            return entity
        }

        return await this.createSharedExpenseTransaction(
            sharedExpense,
            userAgreement,
            destinationUser,
            destinationAccount,
            sourceUser,
            sourceAccount,
            totalFeeAmount,
            totalOwedAmount
        )
    }

    async findOrCreateVendorWebHookTransaction(
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        destinationUser: User,
        destinationAccount: UserAccount,
        sourceUser: User,
        sourceAccount: UserAccount,
        totalFeeAmount: Dinero.Dinero,
        totalOwedAmount: Dinero.Dinero,
        transaction: Transaction
    ) {
        const entity = await this.findTransactionBy({
            sharedExpenseId: sharedExpense.id,
            sharedExpenseUserAgreementId: userAgreement.id,
            sourceAccountId: sourceAccount.id,
            destinationAccountId: destinationAccount.id,
            plaidTransactionId: transaction.id
        })

        if (entity) {
            return entity
        }

        return await this.createSharedExpenseTransaction(
            sharedExpense,
            userAgreement,
            destinationUser,
            destinationAccount,
            sourceUser,
            sourceAccount,
            totalFeeAmount,
            totalOwedAmount,
            transaction
        )
    }

    /**
     * Importantly, this will handle the set up for a refunded transaction.
     * If the amount is negative, the source and destination details are reversed.
     *
     * @param sharedExpense
     * @param userAgreement
     * @param destinationUser
     * @param destinationAccount
     * @param sourceUser
     * @param sourceAccount
     * @param totalFeeAmount
     * @param totalOwedAmount
     * @param transaction
     */
    createSharedExpenseTransaction(
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        destinationUser: User,
        destinationAccount: UserAccount,
        sourceUser: User,
        sourceAccount: UserAccount,
        totalFeeAmount: Dinero.Dinero,
        totalOwedAmount: Dinero.Dinero,
        transaction: Transaction = null
    ): Promise<SharedExpenseTransaction> {
        const entity = new SharedExpenseTransaction({
            totalFeeAmount: totalFeeAmount.getAmount(),
            plaidTransactionId: transaction ? transaction.id : null,
            totalTransactionAmount: Math.abs(totalOwedAmount.getAmount()),
            sharedExpenseId: sharedExpense.id,
            sharedExpenseUserAgreementId: userAgreement.id,
            destinationAccountId: totalOwedAmount.isNegative() ? sourceAccount.id : destinationAccount.id,
            sourceAccountId: totalOwedAmount.isNegative() ? destinationAccount.id : sourceAccount.id,
            sourceUserId: totalOwedAmount.isNegative() ? destinationUser.id : sourceUser.id,
            destinationUserId: totalOwedAmount.isNegative() ? sourceUser.id : destinationUser.id,
            idempotencyToken: uuid(),
            dateTimeInitiated: new Date(),
            dateTimeTransactionScheduled: sharedExpense.dateNextPaymentScheduled
        })

        return this.transactionRepository.save(entity)
    }

    /**
     * History lesson: Originally we started with the idea that we'd charge a flat fee for all transactions.
     * We then decided there would be no fees for users at least for now.
     *
     * @param agreement
     * @param totalTransactionAmount
     */
    computeFee(agreement: SharedExpenseUserAgreement, totalTransactionAmount: Dinero.Dinero) {
        return makeDinero(0)
    }

    computeVendorWebHookAmountOwed(
        agreements: SharedExpenseUserAgreement[],
        agreement: SharedExpenseUserAgreement,
        transaction: Transaction
    ): Dinero.Dinero {
        switch (agreement.contributionType) {
            // Note that Diner's percentage method loses precision and rounds to the nearest dollar
            // they recommend using allocate for precision, but divide works just fine for even amounts
            case ExpenseContributionType.SPLIT_EVENLY:
                return transaction.amount.divide(agreements.length + 1, 'HALF_EVEN')
            case ExpenseContributionType.PERCENTAGE:
                return transaction.amount.percentage(agreement.contributionValue)
            case ExpenseContributionType.FIXED:
                return makeDinero(agreement.contributionValue)
        }
    }

    // Recurring payments will always be computed ahead of time, so while contributionType may be relevant
    // for record keeping/reporting, it's not useful for calculating how much is owed
    computeRecurringPaymentAmountOwed(agreement: SharedExpenseUserAgreement): Dinero.Dinero {
        return makeDinero(agreement.contributionValue)
    }

    /**
     * Once a shared expense transaction has been completed, schedule the next date for this recurring payment
     *
     * @param expense
     */
    scheduleNextRecurringPayment(expense: SharedExpense): Promise<SharedExpense> {
        if (expense.sharedExpenseType !== SharedExpenseType.RECURRING_PAYMENT) {
            throw new BadRequestException('Unable to schedule a non-recurring payment')
        }

        const nextPaymentDue =
            expense.expenseRecurrenceInterval === RecurringExpenseInterval.MONTHS
                ? addMonths(expense.dateNextPaymentScheduled, expense.expenseRecurrenceFrequency)
                : addDays(expense.dateNextPaymentScheduled, expense.expenseRecurrenceFrequency)

        // TODO: Should we send a notification that the last payment has been completed?
        if (expense.recurringPaymentEndDate && nextPaymentDue.getTime() > expense.recurringPaymentEndDate.getTime()) {
            expense.isActive = false
        } else {
            expense.dateNextPaymentScheduled = nextPaymentDue
        }

        return this.sharedExpenseRepository.save(expense)
    }

    /**
     * Handles the successful case for a transfer of funds between 2 parties
     *
     * @param sharedExpenseTransaction
     * @param response
     */
    handleSuccessfulDwollaTransfer(sharedExpenseTransaction: SharedExpenseTransaction, response: Response) {
        sharedExpenseTransaction.dwollaTransferUrl = response.headers.get('location')
        sharedExpenseTransaction.dwollaTransferId = sharedExpenseTransaction.dwollaTransferUrl.split('/').pop()
        sharedExpenseTransaction.numberOfTimesAttempted++
        sharedExpenseTransaction.dwollaStatus = DwollaTransferStatus.PENDING
        sharedExpenseTransaction.dateTimeDwollaStatusUpdated = new Date()
        sharedExpenseTransaction.dateTimeInitiated = new Date()

        return this.transactionRepository.save(sharedExpenseTransaction)
    }

    async markWithheldTransactionsAsSettled(sharedExpenseTransaction: SharedExpenseTransaction) {
        const withheldTransactions = await sharedExpenseTransaction.withheldTransactions

        return await this.withheldTransactionRepository.save(
            withheldTransactions.map((withheldTransaction) => {
                withheldTransaction.hasBeenReconciled = true
                withheldTransaction.dateTimeReconciled = new Date()

                return withheldTransaction
            })
        )
    }

    incrementTransactionAttempts(sharedExpenseTransaction: SharedExpenseTransaction) {
        sharedExpenseTransaction.numberOfTimesAttempted++

        return this.transactionRepository.save(sharedExpenseTransaction)
    }

    async convertUserInviteToAgreement(convertedUser: User, invite: UserInvite) {
        const expense = await invite.sharedExpense

        if (expense === null) {
            throw new HttpException(
                'There are no active expense sharing agreements for this user invititation',
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        const entity = new SharedExpenseUserAgreement({
            userId: convertedUser.id,
            sharedExpenseId: expense.id,
            contributionType: invite.contributionType,
            contributionValue: invite.contributionValue,
            isPending: true,
            isActive: false,
            dateTimeCreated: new Date()
        })

        return await this.userAgreementRepository.save(entity)
    }

    /**
     *
     * @param sharedExpense
     */
    async getSharedExpenseStory(sharedExpense: SharedExpense): Promise<SharedExpenseStory> {
        const agreements = await sharedExpense.userAgreements
        const activeUsers = await mapAsync(agreements, (userAgreement) => userAgreement.user)
        const prospectiveUsers = await sharedExpense.userInvites
        const initiatingUser = await sharedExpense.user

        return {
            sharedExpense: sharedExpense,
            agreements,
            vendor: sharedExpense.uniqueVendorId ? await sharedExpense.uniqueVendor : null,
            initiatingUser: initiatingUser,
            activeUsers,
            prospectiveUsers: prospectiveUsers.filter((user) => !user.isConverted)
        }
    }

    /**
     * User agreement story refers to all of the pieces of information needed to tell a user
     * the story of their expense agreement.
     *
     * e.g. "John Doe has requested that you pay X every time their charged by vendor Y"
     *
     * @param agreement
     */
    async getUserAgreementStory(agreement: SharedExpenseUserAgreement): Promise<UserAgreementStory> {
        return {
            ...(await this.getSharedExpenseStory(await agreement.sharedExpense)),
            userAgreement: agreement
        }
    }

    async serializeSharedExpenseStory(story: SharedExpenseStory) {
        return {
            sharedExpense: instanceToPlain(story.sharedExpense, { excludePrefixes: ['__'] }),
            agreements: story.agreements.map((agreement) => instanceToPlain(agreement, { excludePrefixes: ['__'] })),
            vendor: story.vendor ? await this.vendorService.serializeVendor(story.vendor) : null,
            initiatingUser: await this.userService.serializeUser(story.initiatingUser),
            activeUsers: await mapAsync(story.activeUsers, (user) => this.userService.serializeUser(user)),
            prospectiveUsers: story.prospectiveUsers.map((user) => instanceToPlain(user, { excludePrefixes: ['__'] }))
        }
    }

    async serializeUserAgreementStory(story: UserAgreementStory) {
        return {
            ...(await this.serializeSharedExpenseStory(story)),
            userAgreement: instanceToPlain(story.userAgreement, { excludePrefixes: ['__'] })
        }
    }

    /**
     * TODO: Consider pagination if/when transaction history becomes large
     * @param user
     */
    async getTransactions(user: User): Promise<TransactionStory[]> {
        const transactions = await this.getTransactionHistoryForUser(user)

        return await mapAsync(transactions, async (transaction) => {
            return await this.getTransactionStory(transaction)
        })
    }

    async getTransactionStory(transaction: SharedExpenseTransaction): Promise<TransactionStory> {
        const expense = await transaction.sharedExpense

        return {
            transaction,
            vendor: expense.uniqueVendorId ? await expense.uniqueVendor : null,
            payer: await transaction.sourceUser,
            recipient: await transaction.destinationUser,
            sharedExpense: await transaction.sharedExpense,
            sharedExpenseAgreement: await transaction.sharedExpenseUserAgreement
        }
    }

    /**
     * @param story
     */
    async serializeTransactionStory(story: TransactionStory) {
        return {
            transaction: instanceToPlain(story.transaction, { excludePrefixes: ['__'] }),
            vendor: story.vendor ? await this.vendorService.serializeVendor(story.vendor) : null,
            payer: await this.userService.serializeUser(story.payer),
            recipient: await this.userService.serializeUser(story.recipient),
            sharedExpense: instanceToPlain(story.sharedExpense, { excludePrefixes: ['__'] }),
            sharedExpenseAgreement: instanceToPlain(story.sharedExpenseAgreement, { excludePrefixes: ['__'] })
        }
    }

    async sendTransactionSocketUpdate(transaction: SharedExpenseTransaction) {
        const story = await this.getTransactionStory(transaction)
        const usersToNotify = [story.payer, story.recipient]
        this.eventBus.publish(new TransactionUpdateEvent(usersToNotify, await this.serializeTransactionStory(story)))
    }

    async sendAgreementSocketUpdate<T extends object>(sharedExpense: SharedExpense, event: SocketEvent, payload: T) {
        const agreements = await sharedExpense.userAgreements
        const agreementUsers = await mapAsync(agreements, async (agreement) => await agreement.user)
        const allExpenseParticipants = [await sharedExpense.user, ...agreementUsers]
        allExpenseParticipants.forEach((participant) => {
            this.eventBus.publish(new UserSocketEvent(participant, event, payload))
        })
    }

    setUserAgreementStatus(agreement: SharedExpenseUserAgreement, status: BinaryStatus) {
        agreement.isActive = status === BinaryStatus.IS_ACTIVE
        agreement.isPending = false

        if (status === BinaryStatus.IS_ACTIVE) {
            agreement.dateTimeBecameActive = new Date()
        } else {
            agreement.dateTimeBecameInactive = new Date()
        }

        return this.userAgreementRepository.save(agreement)
    }

    async setAgreementPaymentAccount(
        agreement: SharedExpenseUserAgreement,
        accountId: number
    ): Promise<SharedExpenseUserAgreement> {
        // If the agreement was accepted make sure the payment account is updated
        const paymentAccount = await this.userAccountService.findOneWhere({ id: accountId })

        if (!paymentAccount || paymentAccount.accountType !== PlaidSupportedAccountType.DEPOSITORY) {
            throw new HttpException(`Only depository accounts can be used for payment`, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        agreement.paymentAccountId = paymentAccount.id

        return await this.userAgreementRepository.save(agreement)
    }

    /**
     * Retrieve both expenses created by the user and shared with the user. Think of this function as populating the shared
     * expenses a user should be aware of when managing their agreements.
     *
     * @param user
     * @param params
     */
    async getSharedExpensesForUser(user: User, params: ItemStatusDto = null): Promise<SharedExpense[]> {
        const expensesCreatedByUser = this.getExpensesCreatedByUser(user)
        const expensesSharedWithUser = this.getExpensesSharedWithUser(user)
        const allExpenses = [...(await expensesCreatedByUser), ...(await expensesSharedWithUser)].sort(
            (a, b) => b.dateTimeCreated.getTime() - a.dateTimeCreated.getTime()
        )

        if (params?.isActive) {
            return allExpenses.filter((expense) => expense.isActive)
        }

        if (params?.isPending) {
            return allExpenses.filter((expense) => expense.isPending)
        }

        return allExpenses
    }

    /**
     * This query helps to create a "watchlist" of agreements that require a close watch in ops
     */
    getSharedBillsWithNoTransactions(): Promise<SharedExpenseUserAgreement[]> {
        const qb = this.userAgreementRepository.createQueryBuilder('agreement')
        qb.innerJoin(SharedExpense, 'shared_expense', 'agreement.sharedExpenseId = shared_expense.id')
        qb.leftJoin(
            SharedExpenseTransaction,
            'shared_expense_transaction',
            'agreement.id = shared_expense_transaction.sharedExpenseUserAgreementId'
        )
        qb.where('shared_expense.sharedExpenseType = :type', {
            type: SharedExpenseType.SHARED_BILL
        })
        qb.andWhere('shared_expense.isActive = 1')
        qb.andWhere('agreement.isActive = 1')
        qb.andWhere('shared_expense_transaction.id IS NULL')

        return qb.getMany()
    }

    /**
     * Retrieve a list of shared expenses the user has created
     *
     * @param user
     */
    private getExpensesCreatedByUser(user: User): Promise<SharedExpense[]> {
        return this.sharedExpenseRepository.find({
            where: {
                expenseOwnerUserId: user.id
            }
        })
    }

    /**
     * Retrieve shared expenses that the user has been asked to participate in
     *
     * @param user
     */
    private getExpensesSharedWithUser(user: User): Promise<SharedExpense[]> {
        const query = this.sharedExpenseRepository.createQueryBuilder('expense')

        query.innerJoin('expense.userAgreements', 'agreements', 'expense.id = agreements.sharedExpenseId')

        query.where('expense.expenseOwnerUserId != :sharedExpenseUserId', {
            sharedExpenseUserId: user.id
        })

        query.andWhere('agreements.userId = :agreementUserId', {
            agreementUserId: user.id
        })

        return query.getMany()
    }

    getSharedExpenseUserAgreements(user: User, params: ItemStatusDto = null): Promise<SharedExpenseUserAgreement[]> {
        if (params === null) {
            return this.userAgreementRepository.find({
                where: {
                    userId: user.id
                }
            })
        }

        const query = this.userAgreementRepository.createQueryBuilder()
        query.where('userId = :id', {
            id: user.id
        })

        if (params.isActive) {
            query.andWhere('isActive = :isActive', {
                isActive: params.isActive
            })
        }

        if (params.isPending) {
            query.andWhere('isPending = :isPending', {
                isPending: params.isPending
            })
        }

        return query.getMany()
    }

    getTransactionHistoryForUser(user: User): Promise<SharedExpenseTransaction[]> {
        const query = this.transactionRepository.createQueryBuilder()

        query.where(
            new Brackets((qb) => {
                qb.where('destinationUserId = :id', {
                    id: user.id
                })

                qb.orWhere('sourceUserId = :id', {
                    id: user.id
                })
            })
        )

        query.andWhere('dwollaStatus IS NOT NULL')
        query.addOrderBy(`dateTimeInitiated`, `DESC`)

        return query.getMany()
    }

    /**
     *
     * @param transaction
     * @param transferStatus
     */
    syncTransactionStatus(
        transaction: SharedExpenseTransaction,
        transferStatus: DwollaTransfer
    ): Promise<SharedExpenseTransaction> {
        switch (transferStatus.status) {
            case DwollaTransferStatus.PENDING:
                transaction.hasBeenTransferredToDestination = false
                break
            case DwollaTransferStatus.PROCESSED:
                transaction.hasBeenTransferredToDestination = true
                transaction.dateTimeTransferredToDestination = new Date()
                break
            case DwollaTransferStatus.FAILED:
                transaction.hasBeenTransferredToDestination = false
                break
            case DwollaTransferStatus.CANCELLED:
                transaction.hasBeenTransferredToDestination = false
                break
        }

        transaction.dwollaStatus = transferStatus.status
        transaction.dateTimeDwollaStatusUpdated = new Date()

        return this.transactionRepository.save(transaction)
    }

    /**
     * A user cannot have multiple active expense sharing agreements for a single vendor
     *
     * @param user
     * @param vendor
     */
    async userHasActiveExpenseAgreementForVendor(user: User, vendor: UniqueVendor): Promise<boolean> {
        const count = await this.sharedExpenseRepository.count({
            where: {
                expenseOwnerUserId: user.id,
                uniqueVendorId: vendor.id,
                isActive: true
            }
        })

        return count > 0
    }

    getUserAgreements(expense: SharedExpense): Promise<SharedExpenseUserAgreement[]> {
        return this.userAgreementRepository.find({
            where: {
                sharedExpenseId: expense.id
            }
        })
    }

    logTransactionEvent(
        transaction: SharedExpenseTransaction,
        payload: DwollaWebhookPayload
    ): Promise<SharedExpenseTransactionLog> {
        const entity = new SharedExpenseTransactionLog({
            sharedExpenseTransactionId: transaction.id,
            uuid: payload.id,
            event: payload.topic,
            eventUrl: payload._links.self.href,
            dateTimePosted: new Date(Date.parse(payload.created))
        })

        return this.transactionLogRepository.save(entity)
    }

    /**
     * When a user decides to delete their account, we can't delete shared expenses, etc
     * for other users. Instead, we substitute some of their information for the placeholder
     * account/user we use for all information that can't be deleted for the real user.
     *
     * @param sharedExpenses
     * @param agreements
     * @param transactions
     * @param realUser
     * @param placeholderUser
     * @param placeholderAccount
     */
    async substitutePlaceholderUserForUserRequestingDeletionAndCancelAgreements(
        sharedExpenses: SharedExpense[],
        agreements: SharedExpenseUserAgreement[],
        transactions: SharedExpenseTransaction[],
        realUser: User,
        placeholderUser: User,
        placeholderAccount: UserAccount
    ): Promise<SharedExpense[]> {
        // replace transactions
        const transactionsReplacedWithDummyUser = transactions.map((transaction) => {
            if (transaction.sourceUserId === realUser.id) {
                transaction.sourceUserId = placeholderUser.id
                transaction.sourceAccountId = placeholderAccount.id
            }

            if (transaction.destinationUserId === realUser.id) {
                transaction.destinationUserId = placeholderUser.id
                transaction.destinationAccountId = placeholderAccount.id
            }

            return transaction
        })

        await this.transactionRepository.save(transactionsReplacedWithDummyUser)

        // replace agreements
        const agreementsReplacedWithDummyUser = agreements.map((agreement) => {
            if (agreement.userId === realUser.id) {
                agreement.userId = placeholderUser.id
                agreement.paymentAccountId = placeholderAccount.id
            }

            if (agreement.isActive) {
                agreement.isActive = false
                agreement.isPending = false
                agreement.dateTimeBecameInactive = new Date()
            }

            return agreement
        })

        await this.userAgreementRepository.save(agreementsReplacedWithDummyUser)

        // replace shared expenses
        const sharedExpensesReplacedWithDummyUser = sharedExpenses.map((expense) => {
            if (expense.expenseOwnerUserId === realUser.id) {
                expense.expenseOwnerUserId = placeholderUser.id
                expense.expenseOwnerSourceAccountId = placeholderAccount.id
                expense.expenseOwnerDestinationAccountId = placeholderAccount.id
            }

            if (expense.isActive) {
                expense.isActive = false
                expense.isPending = false
                expense.dateTimeDeactivated = new Date()
            }

            return expense
        })

        await this.plaidLinkTokenService.prepareForUserDeletion(realUser, placeholderUser, placeholderAccount)

        return await this.sharedExpenseRepository.save(sharedExpensesReplacedWithDummyUser)
    }
}
