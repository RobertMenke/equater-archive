import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Dinero } from 'dinero.js'
import { faker } from '@faker-js/faker'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { DwollaTransferStatus } from '../dwolla/dwolla.types'
import {
    CreateRecurringSharedExpenseDto,
    CreateSharedBillDto,
    ExpenseSharingAgreementDto
} from '../expense_api/expense-api.dto'
import { ExpenseApiService } from '../expense_api/expense-api.service'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import {
    ExpenseContributionType,
    SharedExpenseUserAgreement
} from '../shared_expense/shared-expense-user-agreement.entity'
import {
    SharedExpenseWithheldTransaction,
    SharedExpenseWithholdingReason
} from '../shared_expense/shared-expense-withheld-transaction.entity'
import { ExpenseContribution } from '../shared_expense/shared-expense.dto'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, generate, generateAsync, mapAsync, randomBetween } from '../utils/data.utils'
import { UserSeedService } from './user-seed.service'

@Injectable()
export class SharedExpenseSeedService {
    constructor(
        @InjectRepository(SharedExpense)
        private readonly sharedExpenseRepository: Repository<SharedExpense>,
        @InjectRepository(SharedExpenseUserAgreement)
        private readonly expenseUserAgreementRepository: Repository<SharedExpenseUserAgreement>,
        @InjectRepository(SharedExpenseTransaction)
        private readonly expenseTransactionRepository: Repository<SharedExpenseTransaction>,
        @InjectRepository(SharedExpenseWithheldTransaction)
        private readonly withheldTransactionRepository: Repository<SharedExpenseWithheldTransaction>,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly expenseApiService: ExpenseApiService,
        private readonly userSeedService: UserSeedService,
        private readonly accountService: UserAccountService
    ) {}

    async seedVendorWebHookSharedExpenseAgreement(
        user: User,
        userAccount: UserAccount,
        vendor: UniqueVendor,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE
    ): Promise<SharedExpense> {
        const dto: CreateSharedBillDto = {
            expenseNickName: faker.lorem.words(3),
            activeUsers: {},
            prospectiveUsers: {},
            uniqueVendorId: vendor.id,
            expenseOwnerDestinationAccountId: userAccount.id,
            expenseOwnerSourceAccountId: userAccount.id
        }
        const expense = await this.sharedExpenseService.createSharedBill(user, vendor, dto)
        if (status === BinaryStatus.IS_ACTIVE) {
            return await this.sharedExpenseService.setSharedExpenseStatus(expense, status)
        }

        return expense
    }

    async seedRecurringDateSharedExpenseAgreement(
        user: User,
        dto: CreateRecurringSharedExpenseDto,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE
    ): Promise<SharedExpense> {
        const expense = await this.sharedExpenseService.createRecurringDateAgreement(user, dto)

        if (status === BinaryStatus.IS_ACTIVE) {
            return await this.sharedExpenseService.setSharedExpenseStatus(expense, status)
        }

        return expense
    }

    async seedSharedExpenseUserAgreements(
        sharedExpense: SharedExpense,
        numberOfAgreements: number,
        type: ExpenseContributionType = ExpenseContributionType.SPLIT_EVENLY,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE,
        users: User[] = []
    ): Promise<SharedExpenseUserAgreement[]> {
        const contribution = this.createExpenseContribution(numberOfAgreements, type)
        const userIds = await generateAsync(numberOfAgreements, async (index: number) => {
            if (users[index]) {
                return users[index].id
            } else {
                const user = await this.userSeedService.seedVerifiedUser()
                await this.userSeedService.seedUserAccount(user)
                return user.id
            }
        })
        const dto: ExpenseSharingAgreementDto = {
            activeUsers: userIds.reduce((acc, value) => ({ [value]: contribution, ...acc }), {}),
            prospectiveUsers: {},
            expenseNickName: faker.lorem.words(3),
            expenseOwnerDestinationAccountId: sharedExpense.expenseOwnerDestinationAccountId
        }

        const agreements = await this.expenseApiService.createSharedExpenseUserAgreements(sharedExpense, dto)

        if (status === BinaryStatus.IS_ACTIVE) {
            return await mapAsync(agreements, async (agreement) => {
                await this.sharedExpenseService.setUserAgreementStatus(agreement, status)
                const payee = await agreement.user
                let account: UserAccount
                try {
                    account = await this.accountService.findOneWhere({
                        userId: payee.id,
                        isActive: true
                    })
                } catch (e) {}

                if (!account) {
                    account = await this.userSeedService.seedUserAccount(payee)
                }

                return await this.sharedExpenseService.setAgreementPaymentAccount(agreement, account.id)
            })
        }

        return agreements
    }

    async updateSharedExpenseUserAgreement(
        agreement: SharedExpenseUserAgreement,
        mutation: (item: SharedExpenseUserAgreement) => void
    ): Promise<SharedExpenseUserAgreement> {
        mutation(agreement)
        return this.expenseUserAgreementRepository.save(agreement)
    }

    async updateSharedExpense(expense: SharedExpense, mutation: (item: SharedExpense) => void): Promise<SharedExpense> {
        mutation(expense)
        return this.sharedExpenseRepository.save(expense)
    }

    seedSharedExpenseProspectiveAgreements(
        sharedExpense: SharedExpense,
        numberOfAgreements: number,
        type: ExpenseContributionType = ExpenseContributionType.SPLIT_EVENLY
    ): Promise<SharedExpenseUserAgreement[]> {
        const contribution = this.createExpenseContribution(numberOfAgreements, type)
        const emails = generate(numberOfAgreements, () => faker.internet.email().toLowerCase())
        const dto: ExpenseSharingAgreementDto = {
            prospectiveUsers: emails.reduce((acc, value) => ({ [value]: contribution }), {}),
            activeUsers: {},
            expenseNickName: faker.lorem.words(3),
            expenseOwnerDestinationAccountId: sharedExpense.expenseOwnerDestinationAccountId
        }

        return this.expenseApiService.createSharedExpenseUserAgreements(sharedExpense, dto)
    }

    async seedSharedExpenseTransaction(
        fromAccount: UserAccount,
        toAccount: UserAccount,
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        transaction: Transaction = null,
        isComplete: boolean = true
    ) {
        const entity = new SharedExpenseTransaction({
            totalFeeAmount: 100,
            plaidTransactionId: transaction ? transaction.id : null,
            totalTransactionAmount: randomBetween(100, 100 * 5000),
            sharedExpenseId: sharedExpense.id,
            sharedExpenseUserAgreementId: userAgreement.id,
            destinationAccountId: toAccount.id,
            sourceAccountId: fromAccount.id,
            destinationUserId: (await toAccount.user).id,
            sourceUserId: (await fromAccount.user).id,
            idempotencyToken: uuid(),
            hasBeenTransferredToDestination: isComplete,
            dateTimeTransferredToDestination: isComplete ? new Date() : null,
            dwollaStatus: isComplete ? DwollaTransferStatus.PROCESSED : null,
            dwollaTransferUrl: isComplete ? faker.internet.url() : null,
            dwollaTransferId: isComplete ? uuid() : null,
            dateTimeInitiated: new Date()
        })

        return await this.expenseTransactionRepository.save(entity)
    }

    async seedPendingSharedExpenseTransaction(
        fromAccount: UserAccount,
        toAccount: UserAccount,
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        transaction: Transaction = null
    ) {
        const entity = new SharedExpenseTransaction({
            totalFeeAmount: 100,
            plaidTransactionId: transaction ? transaction.id : null,
            totalTransactionAmount: randomBetween(100, 100 * 5000),
            sharedExpenseId: sharedExpense.id,
            sharedExpenseUserAgreementId: userAgreement.id,
            destinationAccountId: toAccount.id,
            sourceAccountId: fromAccount.id,
            destinationUserId: (await toAccount.user).id,
            sourceUserId: (await fromAccount.user).id,
            idempotencyToken: uuid(),
            hasBeenTransferredToDestination: false,
            dateTimeTransferredToDestination: null,
            dwollaStatus: DwollaTransferStatus.PENDING,
            dwollaTransferUrl: faker.internet.url(),
            dwollaTransferId: uuid(),
            dateTimeInitiated: new Date()
        })

        return await this.expenseTransactionRepository.save(entity)
    }

    seedWithheldTransaction(
        lastAttempted: Date,
        sharedExpense: SharedExpense,
        agreement: SharedExpenseUserAgreement,
        transaction: SharedExpenseTransaction,
        fundsAvailable: Dinero,
        contributionValue: Dinero,
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
            dateTimeOriginalPaymentScheduled: sharedExpense.dateNextPaymentScheduled,
            dateTimeAttempted: lastAttempted
        })

        return this.withheldTransactionRepository.save(entity)
    }

    private createExpenseContribution(numberOfAgreements: number, type: ExpenseContributionType): ExpenseContribution {
        if (type === ExpenseContributionType.FIXED) {
            return {
                contributionType: type,
                contributionValue: randomBetween(1000, 100000)
            }
        }

        return {
            contributionType: type,
            contributionValue: Math.round(100 / (numberOfAgreements + 1))
        }
    }
}
