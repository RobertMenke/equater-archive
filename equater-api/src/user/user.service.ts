import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { S3 } from 'aws-sdk'
import { instanceToPlain } from 'class-transformer'
import { addDays, isBefore } from 'date-fns'
import * as firebase from 'firebase-admin'
import { createReadStream } from 'fs'
import { join } from 'path'
import { Brackets, FindOptionsWhere, FindManyOptions, FindOneOptions, In, Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { PushNotificationService, PushNotificationTag } from '../device/push-notification.service'
import { DwollaService } from '../dwolla/dwolla.service'
import { EmailService } from '../email/email.service'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { UserAccountService } from '../user_account/user-account.service'
import { removeDuplicates, verifyPassword } from '../utils/data.utils'
import { Relationship } from './relationship.entity'
import { UserInvite } from './user-invite.entity'
import { ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY } from './user.constants'
import {
    OnBoardingFeedback,
    PatchAddressDto,
    ProfilePhotoStatusDto,
    ProfilePhotoType,
    RecipientOfFundsFormDto,
    UserCredentialsDto,
    UserProfileDto
} from './user.dtos'
import { DwollaCustomerStatus, Role, User } from './user.entity'

// Serialize users will always have the instanceToPlain transformation applied
export interface UserSearchResult {
    friends: Object[]
    users: Object[]
}

@Injectable()
export class UserService implements OnModuleInit, DeletesManagedResources {
    private readonly logger = new Logger(UserService.name)

    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly pushNotificationService: PushNotificationService,
        private readonly s3Service: S3Service,
        private readonly plaidLinkTokenService: PlaidLinkTokenService,
        private readonly userAccountService: UserAccountService,
        private readonly dwollaService: DwollaService
    ) {}

    /**
     * If a user chooses to delete their account, we delete all of their data, but
     * transactions we may have stored may be referenced from `UniqueVendor` records,
     * which we do want to keep.
     *
     * In order to hackishly get around this, we have an account dedicated to serving as a reference
     * for transactions recorded by users who have chosen to delete their accounts.
     */
    async onModuleInit() {
        try {
            const user = await this.createPlaceholderUserForDeletedUsersTransactionHistory()
            this.logger.log(`Placeholder user for deleted account was created -- user id: ${user.id}`)
        } catch (e) {
            this.logger.error(`Error creating placeholder user for deleted transactions ${e.message}`)
        }
    }

    /**
     * @param user
     */
    async deleteManagedResourcesForUser(user: User): Promise<void> {
        await this.dwollaService.deactivateCustomer(user)
        await this.repository.delete({
            id: user.id
        })
        await this.emailService.sendAccountDeletionEmail(user)
    }

    findOne(options: FindOneOptions<User>): Promise<User | null> {
        return this.repository.findOne(options)
    }

    findOneWhere(conditions: FindOptionsWhere<User>): Promise<User | null> {
        return this.repository.findOne({
            where: conditions
        })
    }

    findMany(options: FindManyOptions<User>): Promise<User[]> {
        return this.repository.find(options)
    }

    async findByCredentials(credentials: UserCredentialsDto): Promise<User> {
        const user = await this.repository.findOne({
            where: {
                email: credentials.email.toLowerCase().trim()
            }
        })

        if (user && (await verifyPassword(credentials.password, user.password))) {
            return user
        }

        throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED)
    }

    /**
     * TODO: Lots to optimize here. Current crude method is to optimize for firstName lookups using this technique https://www.codexworld.com/how-to/sort-results-order-by-best-match-using-like-in-mysql/
     *
     * @param authenticatedUser
     * @param searchTerm
     * @param includeAuthenticatedUser
     */
    searchBy(authenticatedUser: User, searchTerm: string, includeAuthenticatedUser: boolean): Promise<User[]> {
        const qb = this.repository.createQueryBuilder()
        const wordsInSearchTerm = searchTerm.split(' ').length
        // If we have multiple words, assume it's a full name search
        if (wordsInSearchTerm > 1) {
            qb.where("concat_ws(' ', firstName, lastName) like :fullName", {
                fullName: `%${searchTerm}%`
            })
        } else {
            qb.where(
                new Brackets((qb) => {
                    qb.where('email like :email', {
                        email: `%${searchTerm}%`
                    })
                    qb.orWhere('firstName like :firstName', {
                        firstName: `%${searchTerm}%`
                    })
                    qb.orWhere('lastName like :lastName', {
                        lastName: `%${searchTerm}%`
                    })
                })
            )
        }

        // Never surface this placeholder account in a search query
        qb.andWhere('email != :placeholderEmail', {
            placeholderEmail: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY
        })

        if (!includeAuthenticatedUser) {
            qb.andWhere('id != :id', {
                id: authenticatedUser.id
            })
        }

        // If users are partially through the sign in flow
        // their first/last name can technically be blank
        qb.andWhere('firstName != :firstNameExclusion', {
            firstNameExclusion: ''
        })
        qb.andWhere('lastName != :lastNameExclusion', {
            lastNameExclusion: ''
        })

        const orderByField = wordsInSearchTerm === 1 ? `firstName` : `lower(concat_ws(' ', firstName, lastName))`

        qb.addOrderBy(`
            CASE
                WHEN ${orderByField} LIKE "${searchTerm}" THEN 1
                WHEN ${orderByField} LIKE "${searchTerm}%" THEN 2
                WHEN ${orderByField} LIKE "%${searchTerm}" THEN 4
                ELSE 3
            END
        `)

        qb.limit(50)

        return qb.getMany()
    }

    findUsersFromRelationships(user: User, relationships: Relationship[]): Promise<User[]> {
        const ids = relationships
            .map((relationship) =>
                relationship.consentingUserId === user.id
                    ? relationship.originatingUserId
                    : relationship.consentingUserId
            )
            .filter((id) => id !== user.id)

        const uniqueUserIds = removeDuplicates(ids)

        return this.repository.find({
            where: {
                id: In(uniqueUserIds)
            }
        })
    }

    async serializeUser(user: User) {
        if (user.profilePhotoUploadCompleted) {
            user.preSignedPhotoDownloadUrl = await this.createPreSignedPhotoDownloadUrl(user, ProfilePhotoType.AVATAR)
        }

        if (user.coverPhotoUploadCompleted) {
            user.preSignedCoverPhotoDownloadUrl = await this.createPreSignedPhotoDownloadUrl(
                user,
                ProfilePhotoType.COVER_PHOTO
            )
        }

        return {
            ...instanceToPlain(user, { excludePrefixes: ['__'] }),
            linkTokens: await this.plaidLinkTokenService.findForUser(user)
        }
    }

    /**
     * We're intentionally reloading here so that typeorm
     * @param dto
     */
    register(dto: UserCredentialsDto) {
        return this.repository.save(
            new User({
                email: dto.email,
                password: dto.password,
                emailIsConfirmed: false,
                emailVerificationCode: uuid(),
                emailVerificationExpirationDate: addDays(
                    new Date(),
                    parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
                )
            })
        )
    }

    createPreSignedPhotoUploadUrl(user: User, type: ProfilePhotoType): Promise<string> {
        const uuid = user.uuid
        const key = type === ProfilePhotoType.AVATAR ? this.createAvatarKey(uuid) : this.createCoverPhotoKey(uuid)
        const params: S3.Types.PutObjectRequest = {
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: key
        }

        return this.s3Service.createPreSignedUploadUrl(params)
    }

    async createPreSignedPhotoDownloadUrl(user: User, type: ProfilePhotoType): Promise<string | null> {
        const uuid = user.uuid
        const key = type === ProfilePhotoType.AVATAR ? this.createAvatarKey(uuid) : this.createCoverPhotoKey(uuid)
        const params: S3.Types.GetObjectRequest = {
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: key
        }

        return await this.s3Service.createPreSignedDownloadUrl(params)
    }

    save(user: User): Promise<User> {
        return this.repository.save(user)
    }

    updateSessionToken(user: User, token: string | null): Promise<User> {
        user.sessionToken = token

        return this.repository.save(user)
    }

    async sendPushNotification(
        user: User,
        tag: PushNotificationTag,
        notification: firebase.messaging.Notification,
        data: { [key: string]: string } = undefined
    ) {
        const devices = await user.devices
        if (devices.length > 0) {
            await this.pushNotificationService.sendNotificationToDevices(devices, tag, notification, data)
        }
    }

    // This is currently only used when a new shared expense invitation gets sent out
    async sendPushNotificationWithBadge(
        user: User,
        tag: PushNotificationTag,
        notification: firebase.messaging.Notification,
        badge: number = 0,
        data: { [key: string]: string } = undefined
    ) {
        const devices = await user.devices
        if (devices.length > 0) {
            await this.pushNotificationService.sendNotificationToDevicesWithBadge(
                devices,
                tag,
                notification,
                badge,
                data
            )
        }
    }

    async sendPushNotificationAndEmail(
        user: User,
        tag: PushNotificationTag,
        notification: firebase.messaging.Notification,
        data: { [key: string]: string } = undefined
    ) {
        await this.sendPushNotification(user, tag, notification, data)
        await this.sendNotificationEmail(user, notification)
    }

    setPassword(user: User, password: string): Promise<User> {
        user.password = password

        return this.repository.save(user)
    }

    setRole(user: User, role: Role): Promise<User> {
        user.role = role

        return this.repository.save(user)
    }

    patchProfile(user: User, profile: UserProfileDto): Promise<User> {
        user.firstName = profile.firstName.trim()
        user.lastName = profile.lastName.trim()

        return this.repository.save(user)
    }

    async setPhotoUploadStatus(user: User, dto: ProfilePhotoStatusDto): Promise<User> {
        if (dto.photoType === ProfilePhotoType.AVATAR) {
            user.profilePhotoUploadCompleted = dto.profilePhotoUploadComplete
            user.profilePhotoMimeType = dto.profilePhotoUploadComplete ? dto.mimeType : null
            user.profilePhotoSha256Hash = dto.profilePhotoUploadComplete
                ? await this.hashAvatarPhoto(user.uuid)
                : user.profilePhotoSha256Hash
        } else {
            user.coverPhotoUploadCompleted = dto.profilePhotoUploadComplete
            user.coverPhotoMimeType = dto.profilePhotoUploadComplete ? dto.mimeType : null
            user.coverPhotoSha256Hash = dto.profilePhotoUploadComplete
                ? await this.hashCoverPhoto(user.uuid)
                : user.coverPhotoSha256Hash
        }

        return await this.repository.save(user)
    }

    setDwollaCustomer(user: User, location: string, dwollaCustomerId: string): Promise<User> {
        user.dwollaCustomerUrl = location
        user.dwollaCustomerId = dwollaCustomerId

        return this.repository.save(user)
    }

    setDwollaCustomerStatus(user: User, type: DwollaCustomerStatus): Promise<User> {
        user.dwollaCustomerStatus = type

        if (type === DwollaCustomerStatus.VERIFIED) {
            user.dwollaReverificationNeeded = false
        }

        return this.repository.save(user)
    }

    updateDwollaCustomer(
        user: User,
        location: string,
        dwollaCustomerId: string,
        type: DwollaCustomerStatus
    ): Promise<User> {
        user.dwollaCustomerUrl = location
        user.dwollaCustomerId = dwollaCustomerId
        user.dwollaCustomerStatus = type

        if (type === DwollaCustomerStatus.VERIFIED) {
            user.dwollaReverificationNeeded = false
        }

        return this.repository.save(user)
    }

    patchRecipientOfFundsFields(user: User, dto: RecipientOfFundsFormDto): Promise<User> {
        const date = new Date(Date.parse(dto.dateOfBirth))
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)
        user.addressOne = dto.address.addressOne
        user.addressTwo = dto.address.addressTwo
        user.city = dto.address.city
        user.state = dto.address.state
        user.postalCode = dto.address.postalCode
        user.dateOfBirth = date
        user.lastFourOfSsn = dto.lastFourOfSsn

        return this.repository.save(user)
    }

    patchAddress(user: User, dto: PatchAddressDto): Promise<User> {
        user.addressOne = dto.address.addressOne
        user.addressTwo = dto.address.addressTwo
        user.city = dto.address.city
        user.state = dto.address.state
        user.postalCode = dto.address.postalCode

        return this.repository.save(user)
    }

    /**
     *
     * @param user
     */
    updateEmailConfirmation(user: User): Promise<User> {
        user.emailVerificationCode = uuid()
        user.emailVerificationExpirationDate = addDays(
            new Date(),
            parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
        )

        return this.repository.save(user)
    }

    emailVerificationTokenIsValid(user: User): boolean {
        const now = new Date(Date.now())

        return isBefore(now, user.emailVerificationExpirationDate)
    }

    passwordResetTokenIsValid(user: User): boolean {
        const now = new Date(Date.now())

        return isBefore(now, user.passwordResetExpirationDate)
    }

    /**
     *
     * @param user
     */
    setEmailIsConfirmed(user: User): Promise<User> {
        user.emailIsConfirmed = true

        return this.repository.save(user)
    }

    sendConfirmEmailMessage(user: User) {
        return this.emailService.sendEmailVerification(user)
    }

    sendNotificationEmail(user: User, notification: firebase.messaging.Notification) {
        return this.emailService.sendNotificationEmail(user, notification)
    }

    sendInviteToParticipateInExpenseAgreementEmail(
        user: User,
        invite: UserInvite,
        notification: firebase.messaging.Notification
    ) {
        return this.emailService.sendInviteToParticipateInExpenseAgreementEmail(user, invite, notification)
    }

    /**
     *
     * @param user
     */
    updatePasswordResetCode(user: User): Promise<User> {
        user.passwordResetCode = uuid()
        user.passwordResetExpirationDate = addDays(
            new Date(),
            parseInt(this.configService.get(Environment.PASSWORD_RESET_EXPIRATION_IN_DAYS), 10)
        )

        return this.repository.save(user)
    }

    sendPasswordResetEmail(user: User) {
        return this.emailService.sendPasswordResetLink(user)
    }

    /**
     * Ensure password reset code is only valid for 1 use
     *
     * @param user
     */
    removePasswordResetCode(user: User): Promise<User> {
        user.passwordResetCode = null
        user.passwordResetExpirationDate = null

        return this.repository.save(user)
    }

    setOnBoardingFeedback(user: User, dto: OnBoardingFeedback): Promise<User> {
        user.onBoardingSelection = dto.selection
        user.onBoardingAdditionalFeedback = dto.additionalFeedback || user.onBoardingAdditionalFeedback

        return this.save(user)
    }

    setDwollaReverificationNeeded(user: User, isNeeded: boolean): Promise<User> {
        user.dwollaReverificationNeeded = isNeeded

        return this.repository.save(user)
    }

    /**
     * Finds the user used as a placeholder in account deletion scenarios
     */
    findPlaceholderUserReservedForDeletedAccountInfo(): Promise<User> {
        return this.findOneWhere({ email: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY })
    }

    /**
     * @see UserController.permanentlyDeleteUser
     */
    async createPlaceholderUserForDeletedUsersTransactionHistory() {
        const email = ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY
        const existingUser = await this.findPlaceholderUserReservedForDeletedAccountInfo()

        if (existingUser) {
            return existingUser
        }

        const user = new User({
            email,
            password: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            firstName: `Deactivated`,
            lastName: `Account`,
            emailIsConfirmed: true,
            emailVerificationCode: uuid(),
            emailVerificationExpirationDate: addDays(
                new Date(),
                parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
            )
        })

        const dbUser = await this.repository.save(user)
        // Deactivated user gets the depressed face meme. Why not?
        await this.userAccountService.createPlaceholderAccountForDeletedUsersTransactionHistory(dbUser)
        const profilePicPath = join(__dirname, '../../public/images/depressed_face_meme.jpg')
        const readStream = createReadStream(profilePicPath)
        const key = this.createAvatarKey(user.uuid)
        const params: S3.Types.PutObjectRequest = {
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: key,
            Body: readStream
        }
        await this.s3Service.uploadFile(params)
        await this.setPhotoUploadStatus(user, {
            mimeType: 'image/jpeg',
            photoType: ProfilePhotoType.AVATAR,
            profilePhotoUploadComplete: true
        })

        return dbUser
    }

    private createCoverPhotoKey(uuid: string): string {
        return `cover_photo/${uuid}`
    }

    private createAvatarKey(uuid: string): string {
        return `avatar/${uuid}`
    }

    private hashAvatarPhoto(uuid: string): Promise<string> {
        return this.s3Service.hashFile({
            Key: this.createAvatarKey(uuid),
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET)
        })
    }

    private hashCoverPhoto(uuid: string): Promise<string> {
        return this.s3Service.hashFile({
            Key: this.createCoverPhotoKey(uuid),
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET)
        })
    }
}
