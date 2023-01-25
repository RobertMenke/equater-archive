import { Exclude, Expose } from 'class-transformer'
import {
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { UserDevice } from '../device/user-device.entity'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { hashPassword } from '../utils/data.utils'
import { nullableEncryptionTransformer } from '../utils/database.utils'
import { LoginLog } from '../login_log/login-log.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { v4 as uuid } from 'uuid'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { Relationship } from './relationship.entity'
import { UserInvite } from './user-invite.entity'
import { OnBoardingSelection } from './user.dtos'

export enum DwollaCustomerStatus {
    NONE,
    UNVERIFIED,
    VERIFIED
}

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export enum DisclosureOfFeesResponse {
    HAS_NOT_SEEN_PROMPT,
    DID_NOT_AGREE_TO_FEES,
    AGREED_TO_FEES
}

/**
 * Notes on User
 * ----------------------------
 *
 * Linking with Plaid:
 *
 * Prior to having any user account on file, we need a plaid access token in order
 * for a user to link their first account, therefore, the User entity must store a plaid
 * link token. The User entity does not need to maintain whether that user requires
 * re-authentication with Plaid. A User does, however, always need to have a valid
 * plaid token while the user is using the app in case the user chooses to link
 * an additional account.
 *
 * The UserAccount entity is responsible for handling updates, therefore, the UserAccount
 * entity needs to have plaidLinkToken, dateTimePlaidLinkTokenExpires, and requiresPlaidReAuthentication
 * fields. When a user signs in or opens the app and fetches the latest user state,
 * each account will have to create a new link token if necessary.
 */
@Entity()
export class User {
    constructor(properties: Partial<User> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @OneToMany((_) => LoginLog, (log) => log.user)
    @Exclude()
    loginLogs: Promise<LoginLog[]>

    @OneToMany((_) => UserAccount, (account) => account.user)
    @Exclude()
    userAccounts: Promise<UserAccount[]>

    @OneToMany((_) => PlaidLinkToken, (token) => token.user)
    @Exclude()
    plaidLinkTokens: Promise<PlaidLinkToken[]>

    @OneToMany(() => SharedExpense, (sharedExpense) => sharedExpense.user)
    @Exclude()
    sharedExpenses: Promise<SharedExpense[]>

    @OneToMany(() => SharedExpenseUserAgreement, (component) => component.user)
    @Exclude()
    sharedExpenseComponents: Promise<SharedExpenseUserAgreement[]>

    @OneToMany(() => SharedExpenseTransaction, (transaction) => transaction.sourceUser)
    @Exclude()
    paidTransactions: Promise<SharedExpenseTransaction[]>

    @OneToMany(() => SharedExpenseTransaction, (transaction) => transaction.destinationUser)
    @Exclude()
    receivedTransactions: Promise<SharedExpenseTransaction[]>

    @OneToMany(() => UserInvite, (invite) => invite.initiatingUser)
    @Exclude()
    invites: Promise<UserInvite[]>

    @OneToMany(() => UserDevice, (device) => device.user)
    @Exclude()
    devices: Promise<UserDevice[]>

    @OneToMany(() => Relationship, (relationship) => relationship.originatingUser)
    @Exclude()
    originatingUserRelationships: Relationship[]

    @OneToMany(() => Relationship, (relationship) => relationship.originatingUser)
    @Exclude()
    consentingUserRelationships: Relationship[]

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string = uuid()

    @Column({
        length: 100,
        transformer: {
            from(email: string) {
                return email.toLowerCase()
            },
            to(email: string) {
                return email.toLowerCase()
            }
        }
    })
    @Index({ unique: true })
    email: string

    @Column({
        type: 'char',
        length: 60
    })
    @Exclude()
    password: string

    @Column({
        length: 20,
        type: 'char',
        nullable: true,
        default: null
    })
    @Index({ unique: false })
    phoneNumber: string = null

    private currentPassword: string

    @AfterLoad()
    private setCurrentPassword() {
        this.currentPassword = this.password
    }

    @BeforeInsert()
    @BeforeUpdate()
    private hashPasswordIfDifferent() {
        if (this.password !== this.currentPassword) {
            this.password = hashPassword(this.password)
            this.currentPassword = this.password
        }
    }

    @Column()
    @Index({ unique: false })
    firstName: string = ''

    @Column()
    @Index({ unique: false })
    lastName: string = ''

    @Column()
    role: Role = Role.USER

    @Column({ nullable: true })
    addressOne: string

    @Column({ nullable: true })
    addressTwo: string

    @Column({ nullable: true })
    city: string

    @Column({ nullable: true })
    state: string

    @Column({ nullable: true })
    postalCode: string

    @Column({ nullable: true })
    @Exclude()
    dateOfBirth: Date

    @Column({
        nullable: true,
        transformer: nullableEncryptionTransformer,
        type: 'text'
    })
    @Exclude()
    lastFourOfSsn: string

    @Column()
    emailIsConfirmed: boolean = false

    @Column({ nullable: true })
    @Index({ unique: true })
    @Exclude()
    emailVerificationCode: string = uuid()

    @Column({ nullable: true })
    @Exclude()
    emailVerificationExpirationDate: Date

    @Column({ nullable: true })
    @Index({ unique: true })
    @Exclude()
    passwordResetCode: string

    @Column({ nullable: true })
    @Exclude()
    passwordResetExpirationDate: Date

    @Column({ nullable: false })
    dateTimeCreated: Date = new Date()

    @Column({ nullable: false })
    profilePhotoUploadCompleted: boolean = false

    @Column({ nullable: true })
    profilePhotoMimeType: string

    @Column({
        nullable: true,
        type: 'char',
        length: 64,
        comment: 'Used for cache invalidation client-side'
    })
    profilePhotoSha256Hash: string = null

    @Column({ nullable: false })
    coverPhotoUploadCompleted: boolean = false

    @Column({ nullable: true })
    coverPhotoMimeType: string

    @Column({
        nullable: true,
        type: 'char',
        length: 64,
        comment: 'Used for cache invalidation client-side'
    })
    coverPhotoSha256Hash: string = null

    @Column({ nullable: true })
    @Exclude()
    dwollaCustomerId: string

    @Column({ nullable: true })
    @Exclude()
    dwollaCustomerUrl: string

    @Column({ nullable: false, type: 'tinyint' })
    @Exclude()
    dwollaCustomerStatus: DwollaCustomerStatus = DwollaCustomerStatus.NONE

    @Column()
    disclosureOfFeesResponse: DisclosureOfFeesResponse = DisclosureOfFeesResponse.HAS_NOT_SEEN_PROMPT

    @Column({ nullable: true, type: 'varchar', length: 255 })
    onBoardingSelection: OnBoardingSelection

    @Column({ nullable: true, type: 'text' })
    onBoardingAdditionalFeedback: string

    @Column({ nullable: true, type: 'text' })
    @Exclude()
    sessionToken: string | null = null

    @Column({ nullable: false, default: false })
    acceptedTermsOfService: boolean

    @Column({ nullable: false, default: false })
    acceptedPrivacyPolicy: boolean

    // https://developers.dwolla.com/guides/personal-verified-customer/handle-verification-statuses#verification-statuses
    @Column({ nullable: false, default: false })
    dwollaReverificationNeeded: boolean = false

    ///////////////////
    // Non-entity props
    ///////////////////
    preSignedPhotoDownloadUrl: string = null
    preSignedCoverPhotoDownloadUrl: string = null
    ///////////////////
    // Computed props
    ///////////////////

    @Expose()
    get canReceiveFunds(): boolean {
        return (
            Boolean(this.addressOne) &&
            Boolean(this.city) &&
            Boolean(this.state) &&
            Boolean(this.postalCode) &&
            Boolean(this.lastFourOfSsn) &&
            Boolean(this.dateOfBirth) &&
            !this.dwollaReverificationNeeded
        )
    }
}
