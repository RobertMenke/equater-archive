import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { addDays, subDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import { Response } from 'dwolla-v2'
import { Headers } from 'node-fetch'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { ConfigService, Environment } from '../config/config.service'
import { PushNotification, PushNotificationStatus } from '../device/push-notification.entity'
import { UserDevice } from '../device/user-device.entity'
import { ExpenseSharingAgreementDto } from '../expense_api/expense-api.dto'
import { LoginLog } from '../login_log/login-log.entity'
import { NewsletterRecipient } from '../newsletter/newsletter-recipient.entity'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { PlaidTokenType } from '../plaid/plaid-token-type'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { ExpenseContributionType } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { AuthService } from '../user/auth.service'
import { MINIMUM_PASSWORD_LENGTH } from '../user/authentication.constants'
import { DwollaIntegrationService } from '../user/dwolla-integration.service'
import { Relationship } from '../user/relationship.entity'
import { UserInvite } from '../user/user-invite.entity'
import { UserInviteService } from '../user/user-invite.service'
import { LinkBankAccountDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, randomBetween } from '../utils/data.utils'

@Injectable()
export class UserSeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserAccount)
        private readonly userAccountRepository: Repository<UserAccount>,
        @InjectRepository(UserInvite)
        private readonly userInviteRepository: Repository<UserInvite>,
        @InjectRepository(LoginLog)
        private readonly loginLogRepository: Repository<LoginLog>,
        @InjectRepository(UserDevice)
        private readonly userDeviceRepository: Repository<UserDevice>,
        @InjectRepository(Relationship)
        private readonly relationshipRepository: Repository<Relationship>,
        @InjectRepository(NewsletterRecipient)
        private readonly newsletterRepository: Repository<NewsletterRecipient>,
        @InjectRepository(PlaidLinkToken)
        private readonly plaidLinkTokenRepository: Repository<PlaidLinkToken>,
        @InjectRepository(PushNotification)
        private readonly pushNotificationRepository: Repository<PushNotification>,
        private readonly userService: UserService,
        private readonly userAccountService: UserAccountService,
        private readonly userInviteService: UserInviteService,
        private readonly configService: ConfigService,
        private readonly dwollaService: DwollaIntegrationService,
        private readonly authService: AuthService
    ) {}

    async seedUser(overrides: Partial<User> = {}): Promise<User> {
        let seededUser = new User({
            email: faker.internet.email(),
            password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            emailIsConfirmed: false,
            emailVerificationCode: uuid(),
            emailVerificationExpirationDate: addDays(
                new Date(),
                parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
            ),
            ...overrides
        })

        seededUser = await this.userRepository.save(seededUser)
        seededUser.sessionToken = this.authService.createBearerToken(seededUser)

        return await this.userRepository.save(seededUser)
    }

    async seedVerifiedUser(overrides: Partial<User> = {}): Promise<User> {
        let user = new User({
            email: faker.internet.email(),
            password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            emailIsConfirmed: true,
            emailVerificationCode: uuid(),
            emailVerificationExpirationDate: addDays(
                new Date(),
                parseInt(this.configService.get(Environment.EMAIL_CONFIRMED_EXPIRATION_IN_DAYS), 10)
            ),
            addressOne: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
            postalCode: faker.address.zipCode(),
            lastFourOfSsn: randomBetween(1000, 9999).toString(10),
            dateOfBirth: new Date(),
            ...overrides
        })

        user = await this.userRepository.save(user)
        user.sessionToken = this.authService.createBearerToken(user)

        return await this.userRepository.save(user)
    }

    async seedLoginLog(user: User): Promise<LoginLog> {
        return await this.loginLogRepository.save(
            new LoginLog({
                userId: user.id,
                ipAddress: faker.internet.ip(),
                sessionId: uuid(),
                userAgent: faker.internet.userAgent(),
                dateTimeAuthenticated: faker.date.between(subDays(new Date(), 30), subDays(new Date(), 1))
            })
        )
    }

    async seedUserAccount(user: User, accountId: string = uuid(), plaidItemId: string = null): Promise<UserAccount> {
        const mockDto: LinkBankAccountDto = {
            token: uuid(),
            metaData: {
                account: {
                    id: accountId || uuid(),
                    name: faker.company.name(),
                    subtype: 'checking',
                    type: PlaidSupportedAccountType.DEPOSITORY,
                    mask: faker.finance.mask(4)
                },
                institution: {
                    institutionId: uuid(),
                    name: faker.company.name()
                }
            }
        }

        const institution = await this.userAccountService.saveInstitution(uuid())
        let account = await this.userAccountService.createAccount(user, mockDto, institution)
        // For the majority of seeding use cases we're testing a user linking their 1 financial institution.
        // in specialized cases we may need to test a user with multiple linked financial institutions.
        account.plaidItemId = plaidItemId || user.uuid
        account.plaidAccessToken = uuid()
        account = await this.userAccountRepository.save(account)

        const fundingSource = await this.createFundingSource()

        return await this.userAccountService.setDwollaFundingSource(account, fundingSource)
    }

    private createFundingSource(): Promise<Response> {
        const headers = new Headers({
            location: `https://api-sandbox.dwolla.com/funding-sources/${uuid()}`
        })

        // @ts-ignore
        return Promise.resolve({
            status: 200,
            headers: headers,
            body: {}
        })
    }

    seedUserInvite(userInitiatingInvite: User, sharedExpense: SharedExpense, email: string): Promise<UserInvite> {
        const dto: ExpenseSharingAgreementDto = {
            expenseNickName: faker.lorem.words(3),
            activeUsers: {},
            prospectiveUsers: {
                [email]: {
                    contributionType: ExpenseContributionType.PERCENTAGE,
                    contributionValue: 50
                }
            },
            expenseOwnerDestinationAccountId: sharedExpense.expenseOwnerDestinationAccountId
        }

        return this.userInviteService.createUserInvite(email, sharedExpense, dto.prospectiveUsers[email])
    }

    seedUserDevice(user: User) {
        const entity = new UserDevice({
            userId: user.id,
            fcmToken: uuid(),
            deviceModel: uuid(),
            deviceOsVersion: uuid(),
            deviceOsName: uuid()
        })

        return this.userDeviceRepository.save(entity)
    }

    seedRelationship(originatingUser: User, consentingUser, status: BinaryStatus): Promise<Relationship> {
        const entity = new Relationship({
            originatingUserId: originatingUser.id,
            consentingUserId: consentingUser.id,
            isConfirmed: status === BinaryStatus.IS_ACTIVE,
            dateTimeConfirmed: status === BinaryStatus.IS_ACTIVE ? new Date() : null
        })

        return this.relationshipRepository.save(entity)
    }

    seedNewsletterRecipient(email: string = null): Promise<NewsletterRecipient> {
        const recipient = new NewsletterRecipient({
            email: email || faker.internet.email()
        })

        return this.newsletterRepository.save(recipient)
    }

    seedPlaidLinkToken(properties: Partial<PlaidLinkToken> = {}): Promise<PlaidLinkToken> {
        const entity = new PlaidLinkToken({
            plaidLinkToken: uuid(),
            tokenType: PlaidTokenType.DEPOSITORY_ONLY,
            dateTimeTokenExpires: addDays(new Date(), 1),
            ...properties
        })

        return this.plaidLinkTokenRepository.save(entity)
    }

    seedPushNotification(device: UserDevice, properties: Partial<PushNotification> = {}): Promise<PushNotification> {
        const entity = new PushNotification({
            messageId: uuid(),
            status: properties.status || PushNotificationStatus.SUCCESS,
            deviceId: device.id
        })

        return this.pushNotificationRepository.save(entity)
    }
}
