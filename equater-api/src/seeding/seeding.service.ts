import { Injectable } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { addDays } from 'date-fns'
import { Dinero } from 'dinero.js'
import { faker } from '@faker-js/faker'
import { createReadStream } from 'fs'
import { Transaction as PlaidTransaction } from 'plaid'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { PushNotification } from '../device/push-notification.entity'
import { UserDevice } from '../device/user-device.entity'
import { CreateRecurringSharedExpenseDto } from '../expense_api/expense-api.dto'
import { LoginLog } from '../login_log/login-log.entity'
import { NewsletterRecipient } from '../newsletter/newsletter-recipient.entity'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import {
    ExpenseContributionType,
    SharedExpenseUserAgreement
} from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpenseWithholdingReason } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { Transaction } from '../transaction/transaction.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { MINIMUM_PASSWORD_LENGTH } from '../user/authentication.constants'
import { Relationship } from '../user/relationship.entity'
import { UserInvite } from '../user/user-invite.entity'
import { ProfilePhotoType } from '../user/user.dtos'
import { Role, User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { BinaryStatus } from '../utils/data.utils'
import { PlaidSeedService } from './plaid-seed.service'
import {
    SAMPLE_BRAND_ASSETS_DIRECTORY,
    SAMPLE_FILES_DIRECTORY,
    SAMPLE_PHOTO,
    SAMPLE_VENDOR_ICON
} from './seeding.constants'
import { SharedExpenseSeedService } from './shared-expense-seed.service'
import { TransactionSeedService } from './transaction-seed.service'
import { UserSeedService } from './user-seed.service'

// There's a bit of indirection in this class, but the idea is that this is the
// only API that the test cases need to interface directly with for direct seeding
// This class will also be used to creating "testing scenarios" which will be more
// complicated arrangements of entities intended to create a real-world scenario
@Injectable()
export class SeedingService {
    constructor(
        private readonly userSeedService: UserSeedService,
        private readonly plaidSeedService: PlaidSeedService,
        private readonly expenseSeedService: SharedExpenseSeedService,
        private readonly transactionSeedService: TransactionSeedService,
        private readonly s3Service: S3Service,
        private readonly configService: ConfigService
    ) {}

    seedUser(user: Partial<User> = {}) {
        return this.userSeedService.seedUser(user)
    }

    seedVerifiedUser(overrides: Partial<User> = {}) {
        return this.userSeedService.seedVerifiedUser(overrides)
    }

    seedAdmin() {
        return this.userSeedService.seedUser(
            new User({
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                role: Role.ADMIN,
                emailIsConfirmed: false,
                emailVerificationCode: uuid(),
                emailVerificationExpirationDate: addDays(
                    new Date(),
                    parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
                )
            })
        )
    }

    seedUserAccount(user: User, accountId: string = uuid(), plaidItemId: string = null): Promise<UserAccount> {
        return this.userSeedService.seedUserAccount(user, accountId, plaidItemId)
    }

    seedPlaidLinkToken(properties: Partial<PlaidLinkToken> = {}): Promise<PlaidLinkToken> {
        return this.userSeedService.seedPlaidLinkToken(properties)
    }

    seedPlaidLinkTokenForUser(user: User): Promise<PlaidLinkToken[]> {
        return this.plaidSeedService.seedLinkTokens(user)
    }

    seedPlaidInstitution(id: string = uuid()) {
        return this.plaidSeedService.seedPlaidInstitution(id)
    }

    seedUserInvite(userInitiatingInvite: User, sharedExpense: SharedExpense, email: string): Promise<UserInvite> {
        return this.userSeedService.seedUserInvite(userInitiatingInvite, sharedExpense, email)
    }

    seedUserDevice(user: User) {
        return this.userSeedService.seedUserDevice(user)
    }

    seedRelationship(originatingUser: User, consentingUser, status: BinaryStatus): Promise<Relationship> {
        return this.userSeedService.seedRelationship(originatingUser, consentingUser, status)
    }

    async seedLoginLog(user: User): Promise<LoginLog> {
        return this.userSeedService.seedLoginLog(user)
    }

    async seedSharedBill(
        user: User,
        userAccount: UserAccount,
        vendor: UniqueVendor,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE
    ): Promise<SharedExpense> {
        return this.expenseSeedService.seedVendorWebHookSharedExpenseAgreement(user, userAccount, vendor, status)
    }

    async seedRecurringPayment(
        user: User,
        dto: CreateRecurringSharedExpenseDto,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE
    ): Promise<SharedExpense> {
        return this.expenseSeedService.seedRecurringDateSharedExpenseAgreement(user, dto, status)
    }

    async seedSharedExpenseUserAgreements(
        sharedExpense: SharedExpense,
        numberOfAgreements: number,
        type: ExpenseContributionType = ExpenseContributionType.SPLIT_EVENLY,
        status: BinaryStatus = BinaryStatus.IS_INACTIVE,
        users: User[] = []
    ): Promise<SharedExpenseUserAgreement[]> {
        return this.expenseSeedService.seedSharedExpenseUserAgreements(
            sharedExpense,
            numberOfAgreements,
            type,
            status,
            users
        )
    }

    async updateSharedExpenseUserAgreement(
        agreement: SharedExpenseUserAgreement,
        mutation: (item: SharedExpenseUserAgreement) => void
    ): Promise<SharedExpenseUserAgreement> {
        return this.expenseSeedService.updateSharedExpenseUserAgreement(agreement, mutation)
    }

    async updateSharedExpense(expense: SharedExpense, mutation: (item: SharedExpense) => void): Promise<SharedExpense> {
        return this.expenseSeedService.updateSharedExpense(expense, mutation)
    }

    seedSharedExpenseProspectiveAgreements(
        sharedExpense: SharedExpense,
        numberOfAgreements: number
    ): Promise<SharedExpenseUserAgreement[]> {
        return this.expenseSeedService.seedSharedExpenseProspectiveAgreements(sharedExpense, numberOfAgreements)
    }

    seedSharedExpenseTransaction(
        fromAccount: UserAccount,
        toAccount: UserAccount,
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        transaction: Transaction = null,
        isComplete: boolean = true
    ) {
        return this.expenseSeedService.seedSharedExpenseTransaction(
            fromAccount,
            toAccount,
            sharedExpense,
            userAgreement,
            transaction,
            isComplete
        )
    }

    seedPendingSharedExpenseTransaction(
        fromAccount: UserAccount,
        toAccount: UserAccount,
        sharedExpense: SharedExpense,
        userAgreement: SharedExpenseUserAgreement,
        transaction: Transaction = null
    ) {
        return this.expenseSeedService.seedPendingSharedExpenseTransaction(
            fromAccount,
            toAccount,
            sharedExpense,
            userAgreement,
            transaction
        )
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
        return this.expenseSeedService.seedWithheldTransaction(
            lastAttempted,
            sharedExpense,
            agreement,
            transaction,
            fundsAvailable,
            contributionValue,
            plaidTransaction,
            withholdingReason
        )
    }

    seedPlaidTransaction(
        account: UserAccount,
        transaction: PlaidTransaction,
        vendor: UniqueVendor
    ): Promise<Transaction> {
        return this.plaidSeedService.seedPlaidTransaction(account, transaction, vendor)
    }

    seedHistoricalTransactionPull(user: User): Promise<Transaction[]> {
        return this.plaidSeedService.seedHistoricalTransactionPull(user)
    }

    getVendors(): Promise<UniqueVendor[]> {
        return this.plaidSeedService.getVendors()
    }

    getLastVendor(): Promise<UniqueVendor> {
        return this.plaidSeedService.getLastVendor()
    }

    seedVendor(vendor: UniqueVendor) {
        return this.transactionSeedService.seedVendor(vendor)
    }

    seedVendorName(vendor: UniqueVendor) {
        return this.transactionSeedService.seedVendorName(vendor)
    }

    seedVendorAssociation(vendor: UniqueVendor, associatedVendor: UniqueVendor) {
        return this.transactionSeedService.seedVendorAssociation(vendor, associatedVendor)
    }

    seedNewsletterRecipient(email: string = null): Promise<NewsletterRecipient> {
        return this.userSeedService.seedNewsletterRecipient(email)
    }

    uploadSamplePhoto(user: User, type: ProfilePhotoType) {
        const readStream = createReadStream(`${SAMPLE_FILES_DIRECTORY}/${SAMPLE_PHOTO}`)
        const key =
            type === ProfilePhotoType.AVATAR ? this.createAvatarKey(user.uuid) : this.createCoverPhotoKey(user.uuid)

        return this.s3Service.createWriteStream({
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: key,
            Body: readStream
        })
    }

    async addVendorLogo(app: NestExpressApplication, vendor: UniqueVendor): Promise<UniqueVendor> {
        const repository = app.get<Repository<UniqueVendor>>(`${UniqueVendor.name}Repository`)
        const configService = app.get<ConfigService>(ConfigService)
        // Seed a logo url for the vendor
        await this.uploadSampleVendorLogo(vendor)
        vendor.logoS3Bucket = configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
        vendor.logoS3Key = vendor.uuid
        vendor.logoUploadCompleted = true
        vendor.dateTimeModified = new Date()

        return await repository.save(vendor)
    }

    uploadSampleVendorLogo(vendor: UniqueVendor) {
        const readStream = createReadStream(`${SAMPLE_BRAND_ASSETS_DIRECTORY}/${SAMPLE_VENDOR_ICON}`)

        return this.s3Service.createWriteStream({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${vendor.uuid}`,
            Body: readStream
        })
    }

    uploadPreProcessedVendorLogo(vendor: UniqueVendor) {
        const readStream = createReadStream(`${SAMPLE_BRAND_ASSETS_DIRECTORY}/${SAMPLE_VENDOR_ICON}`)

        return this.s3Service.createWriteStream({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`,
            Body: readStream
        })
    }

    seedPushNotification(device: UserDevice, properties: Partial<PushNotification> = {}): Promise<PushNotification> {
        return this.userSeedService.seedPushNotification(device, properties)
    }

    private createCoverPhotoKey(uuid: string): string {
        return `cover_photo/${uuid}`
    }

    private createAvatarKey(uuid: string): string {
        return `avatar/${uuid}`
    }
}
