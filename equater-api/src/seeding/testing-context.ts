import { Logger } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { faker } from '@faker-js/faker'
import { v4 as uuid } from 'uuid'
import { ConfigService, Environment } from '../config/config.service'
import { PushNotification } from '../device/push-notification.entity'
import { UserDevice } from '../device/user-device.entity'
import { CreateRecurringSharedExpenseDto } from '../expense_api/expense-api.dto'
import { LoginLog } from '../login_log/login-log.entity'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import {
    ExpenseContributionType,
    SharedExpenseUserAgreement
} from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpenseWithheldTransaction } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { RecurringExpenseInterval, SharedExpense, SharedExpenseType } from '../shared_expense/shared-expense.entity'
import { PLAID_TEST_ACCOUNT_WITH_ACH_ID } from '../test.constants'
import { Transaction } from '../transaction/transaction.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorTransactionName } from '../transaction/vendor-transaction-name.entity'
import { Relationship } from '../user/relationship.entity'
import { UserInvite } from '../user/user-invite.entity'
import { ProfilePhotoType } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { BinaryStatus, generateAsync, makeDinero, mapAsync, randomBetween, repeatAsync } from '../utils/data.utils'
import { SeedingService } from './seeding.service'

export class TestingContext {
    private readonly logger = new Logger(TestingContext.name)
    private user: User
    private userAccount: UserAccount
    private loginLogs: LoginLog[]
    private userInvite: UserInvite
    private userDevices: UserDevice[] = []
    private pushNotifications: PushNotification[] = []
    private relationships: Relationship[] = []
    private sharedExpense: SharedExpense
    private sharedExpenseUserAgreements: SharedExpenseUserAgreement[] = []
    // User agreements that are based on user invites for users that are not yet on the platform
    private sharedExpenseProspectiveAgreements: SharedExpenseUserAgreement[] = []
    private sharedExpenseTransactions: SharedExpenseTransaction[] = []
    private withheldTransactions: SharedExpenseWithheldTransaction[] = []
    private transactions: Transaction[] = []
    private vendor: UniqueVendor
    private vendors: UniqueVendor[] = []
    private vendorNames: VendorTransactionName[] = []
    // Properties prefixed with 'secondary' refer to testing artifacts/entities
    // that are not the main focus of the test case. For example, most test cases
    // follow the format of "I'm a user, doing x, with y resource", but often times
    // there are ancillary resources that may be useful to interact with. For example,
    // "look up active shared expenses" and then assert that you did indeed have at least some
    // inactive expense in the pool requires that we keep track of what we're considering
    // an ancillary testing resource.
    private secondaryUsers: User[] = []
    private secondaryUserDevices: UserDevice[] = []
    private secondaryLinkedAccounts: UserAccount[] = []
    private linkTokens: PlaidLinkToken[] = []

    constructor(private readonly seedService: SeedingService, private readonly configService: ConfigService) {}

    static fromApp(app: NestExpressApplication) {
        return new TestingContext(app.get<SeedingService>(SeedingService), app.get<ConfigService>(ConfigService))
    }
    ////////////////////////////
    // Fluent Setters
    ////////////////////////////

    /**
     * Attempting a fluent-ish API
     */
    async chain(...methods: (() => void)[]) {
        for (const method of methods) {
            try {
                await method.call(this)
            } catch (e) {
                this.logger.error(e.message, e.stack, TestingContext.name)
                throw e
            }
        }

        return this
    }

    async withUser(overrides: Partial<User> = {}) {
        this.user = await this.seedService.seedVerifiedUser(overrides)
    }

    async withUnverifiedUser(overrides: Partial<User> = {}) {
        this.user = await this.seedService.seedUser(overrides)
    }

    /**
     * No different than withUser other than seeding a real photo into the localstack
     * S3 bucket
     */
    async withUserHavingProfilePhoto(overrides: Partial<User> = {}) {
        await this.withUser({
            profilePhotoUploadCompleted: true,
            profilePhotoMimeType: faker.system.mimeType(),
            ...overrides
        })

        await this.seedService.uploadSamplePhoto(this.user, ProfilePhotoType.AVATAR)
    }

    async withUserHavingCoverPhoto(overrides: Partial<User> = null) {
        await this.withUser({
            coverPhotoUploadCompleted: true,
            coverPhotoMimeType: faker.system.mimeType(),
            ...overrides
        })

        await this.seedService.uploadSamplePhoto(this.user, ProfilePhotoType.COVER_PHOTO)
    }

    /**
     *
     * @param accountId
     * @param plaidItemId
     */
    async withLinkedBankAccount(accountId: string = uuid(), plaidItemId: string = null) {
        if (!this.user) {
            await this.withUser()
        }

        this.userAccount = await this.seedService.seedUserAccount(this.user, accountId, plaidItemId)
    }

    async withUserDevice() {
        if (!this.user) {
            await this.withUser()
        }

        this.userDevices.push(await this.seedService.seedUserDevice(this.user))
    }

    async withRelationship(status: BinaryStatus = BinaryStatus.IS_ACTIVE) {
        if (!this.user) {
            await this.withUser()
        }

        if (this.secondaryUsers.length === 0) {
            await this.withPayee()
        }

        this.relationships.push(await this.seedService.seedRelationship(this.user, this.secondaryUsers[0], status))
    }

    async withLoginLogs(user: User = null, numberOfLogs: number = 1) {
        const loginUser = user || this.user
        this.loginLogs = await generateAsync(numberOfLogs, () => this.seedService.seedLoginLog(loginUser))
    }

    async withPayee() {
        const user = await this.seedService.seedUser()
        const account = await this.seedService.seedUserAccount(user)

        this.secondaryUsers.push(user)
        this.secondaryLinkedAccounts.push(account)

        return this
    }

    async withPayeeDevice(payee: User = null) {
        if (this.secondaryUsers.length === 0) {
            await this.withPayee()
        }

        payee = payee || this.secondaryUsers[0]
        this.secondaryUserDevices.push(await this.seedService.seedUserDevice(payee))
    }

    async withPayees(numberOfPayees) {
        await repeatAsync(numberOfPayees, this.withPayee.bind(this))

        return this
    }

    async withUserInvite() {
        if (!this.user) {
            throw new Error('No user has been defined for this TestingContext')
        }

        if (!this.sharedExpense) {
            await this.withSharedBill(BinaryStatus.IS_ACTIVE)
        }

        this.userInvite = await this.seedService.seedUserInvite(this.user, this.sharedExpense, faker.internet.email())

        return this
    }

    async withUniqueVendors(numberOfVendors: number = 1, withCompleteInformation: boolean = false) {
        await repeatAsync(numberOfVendors, () => this.withUniqueVendor(uuid(), withCompleteInformation))
    }

    async withUniqueVendor(
        name: string = uuid(),
        withCompleteInformation: boolean = false,
        vendorIdentityCannotBeDetermined: boolean = false
    ) {
        let vendor = new UniqueVendor({
            friendlyName: name,
            ppdId: withCompleteInformation ? uuid() : null,
            hasBeenReviewedInternally: withCompleteInformation,
            totalNumberOfExpenseSharingAgreements: randomBetween(0, 100),
            vendorIdentityCannotBeDetermined
        })

        vendor = await this.seedService.seedVendor(vendor)

        if (withCompleteInformation) {
            await this.seedService.uploadSampleVendorLogo(vendor)
            vendor.logoS3Bucket = this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
            vendor.logoS3Key = vendor.uuid
            vendor.dateTimeModified = new Date()
            this.vendors.push(await this.seedService.seedVendor(vendor))
        } else {
            this.vendors.push(vendor)
        }

        this.vendorNames.push(await this.seedService.seedVendorName(vendor))
    }

    async withVendorAssociation(vendor: UniqueVendor, associatedVendor: UniqueVendor) {
        await this.seedService.seedVendorAssociation(vendor, associatedVendor)

        return this
    }

    async withSharedBill(status: BinaryStatus = BinaryStatus.IS_INACTIVE, vendor: UniqueVendor = undefined) {
        if (!this.vendor) {
            await this.withTransactionHistory()
        }

        this.sharedExpense = await this.seedService.seedSharedBill(
            this.user,
            this.userAccount,
            vendor || this.vendor,
            status
        )

        return this
    }

    async withRecurringPayment(
        status: BinaryStatus = BinaryStatus.IS_INACTIVE,
        startDate: Date = new Date(),
        dto: CreateRecurringSharedExpenseDto = null
    ) {
        if (!this.user) {
            await this.withUser()
            await this.withLinkedBankAccount()
        }

        if (this.secondaryUsers.length === 0) {
            await this.withPayee()
        }

        dto = dto || {
            expenseNickName: faker.lorem.words(3),
            activeUsers: {
                [this.secondaryUsers[0].id]: {
                    contributionType: ExpenseContributionType.SPLIT_EVENLY,
                    contributionValue: 5000
                }
            },
            prospectiveUsers: {},
            interval: RecurringExpenseInterval.MONTHS,
            expenseFrequency: 1,
            startDate: startDate.toISOString(),
            endDate: null,
            expenseOwnerDestinationAccountId: this.userAccount.id
        }

        this.sharedExpense = await this.seedService.seedRecurringPayment(this.user, dto, status)

        return this
    }

    async withPlaidLinkTokens() {
        if (!this.user) {
            await this.withUser()
        }

        this.linkTokens = await this.seedService.seedPlaidLinkTokenForUser(this.user)
    }

    async updateSharedExpense(mutation: (expense: SharedExpense) => void): Promise<void> {
        this.sharedExpense = await this.seedService.updateSharedExpense(this.sharedExpense, mutation)
    }

    async withSharedExpenseUserAgreements(
        status: BinaryStatus = BinaryStatus.IS_INACTIVE,
        type: ExpenseContributionType = ExpenseContributionType.SPLIT_EVENLY
    ) {
        this.sharedExpenseUserAgreements = await this.seedService.seedSharedExpenseUserAgreements(
            this.sharedExpense,
            this.secondaryUsers.length,
            type,
            status,
            this.secondaryUsers
        )

        return this
    }

    async updateUserAgreements(mutation: (agreement: SharedExpenseUserAgreement) => void): Promise<void> {
        this.sharedExpenseUserAgreements = await mapAsync(this.sharedExpenseUserAgreements, (agreement) => {
            return this.seedService.updateSharedExpenseUserAgreement(agreement, mutation)
        })
    }

    async withSharedExpenseProspectiveAgreements(numberOfAgreements) {
        this.sharedExpenseProspectiveAgreements = await this.seedService.seedSharedExpenseProspectiveAgreements(
            this.sharedExpense,
            numberOfAgreements
        )

        return this
    }

    async withSharedExpenseTransaction(isComplete: boolean = true, account: UserAccount = null) {
        account = account
            ? this.secondaryLinkedAccounts.find((item) => item.id === account.id)
            : this.secondaryLinkedAccounts[0]

        const userAgreement = this.sharedExpenseUserAgreements.find((agreement) => {
            return agreement.userId === account.userId
        })

        const transaction = await this.seedService.seedSharedExpenseTransaction(
            account,
            this.userAccount,
            this.sharedExpense,
            userAgreement,
            this.transactions[0],
            isComplete
        )

        this.sharedExpenseTransactions.push(transaction)
    }

    async withPendingSharedExpenseTransaction(account: UserAccount = null) {
        account = account
            ? this.secondaryLinkedAccounts.find((item) => item.id === account.id)
            : this.secondaryLinkedAccounts[0]

        const userAgreement = this.sharedExpenseUserAgreements.find((agreement) => {
            return agreement.userId === account.userId
        })

        const transaction = await this.seedService.seedPendingSharedExpenseTransaction(
            account,
            this.userAccount,
            this.sharedExpense,
            userAgreement,
            this.transactions[0]
        )

        this.sharedExpenseTransactions.push(transaction)
    }

    async withSharedExpenseTransactionFromSharedExpense(sharedExpense: SharedExpense, isComplete: boolean = true) {
        const account = await sharedExpense.expenseOwnerSourceAccount
        const agreement = (await sharedExpense.userAgreements)[0]
        let plaidTransaction = null

        if (sharedExpense.sharedExpenseType === SharedExpenseType.SHARED_BILL) {
            plaidTransaction = this.transactions.find(
                (record) => record.uniqueVendorId === sharedExpense.uniqueVendorId
            )
        }

        const transaction = await this.seedService.seedSharedExpenseTransaction(
            account,
            this.userAccount,
            this.sharedExpense,
            agreement,
            plaidTransaction,
            isComplete
        )

        this.sharedExpenseTransactions.push(transaction)
    }

    async withTransactionHistory() {
        if (!this.user) {
            await this.withUser()
        }

        if (!this.userAccount) {
            await this.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
        }

        this.transactions = await this.seedService.seedHistoricalTransactionPull(this.user)
        this.vendor = await this.seedService.getLastVendor()
    }

    async withWithheldTransaction(lastAttempted: Date, transaction: SharedExpenseTransaction = null) {
        if (this.sharedExpenseTransactions.length === 0) {
            await this.withSharedBill(BinaryStatus.IS_ACTIVE)
            await this.withPayee()
            await this.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            await this.withSharedExpenseTransaction(false)
        }

        transaction = transaction || this.sharedExpenseTransactions[0]
        const agreement = await transaction.sharedExpenseUserAgreement
        const expense = await agreement.sharedExpense
        this.withheldTransactions.push(
            await this.seedService.seedWithheldTransaction(
                lastAttempted,
                expense,
                agreement,
                transaction,
                makeDinero(10000),
                makeDinero(agreement.contributionValue),
                transaction.plaidTransactionId ? await transaction.plaidTransaction : null
            )
        )

        return this
    }

    async withPushNotifications(contents: Partial<PushNotification> = {}, numberOfNotifications: number = 1) {
        if (this.getUserDevices().length === 0) {
            await this.withUserDevice()
        }

        const device = this.getUserDevices()[0]

        await repeatAsync(numberOfNotifications, async () => {
            const notification = await this.seedService.seedPushNotification(device, contents)
            this.pushNotifications.push(notification)
        })
    }

    ////////////////////////////
    // Getters
    ////////////////////////////

    getUser() {
        return this.user
    }

    getUserAccount() {
        return this.userAccount
    }

    getUserDevices() {
        return this.userDevices
    }

    getSecondaryUsers() {
        return this.secondaryUsers
    }

    getSecondaryUserDevices() {
        return this.secondaryUserDevices
    }

    getSecondaryUserAccounts() {
        return this.secondaryLinkedAccounts
    }

    getUserInvite() {
        return this.userInvite
    }

    getRelationships() {
        return this.relationships
    }

    getSharedExpense() {
        return this.sharedExpense
    }

    getSharedExpenseUserAgreements() {
        return this.sharedExpenseUserAgreements
    }

    getSharedExpenseProspectiveAgreements() {
        return this.sharedExpenseProspectiveAgreements
    }

    getSharedExpenseTransactions() {
        return this.sharedExpenseTransactions
    }

    getWithheldTransactions() {
        return this.withheldTransactions
    }

    getPlaidTransactions() {
        return this.transactions
    }

    getUniqueVendor() {
        return this.vendor
    }

    getUniqueVendors() {
        return this.vendors
    }

    getVendorTransactionNames() {
        return this.vendorNames
    }
}
