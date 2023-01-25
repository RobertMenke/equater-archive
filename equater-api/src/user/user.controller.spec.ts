import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { plainToClass } from 'class-transformer'
import { subDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { In } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { DeviceRegistrationDto } from '../device/device.dto'
import { DeviceService } from '../device/device.service'
import { PushNotificationService } from '../device/push-notification.service'
import { DwollaService } from '../dwolla/dwolla.service'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { Balance, DwollaTransferStatus } from '../dwolla/dwolla.types'
import { EmailService } from '../email/email.service'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { LoginLogService } from '../login_log/login-log.service'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidTokenType } from '../plaid/plaid-token-type'
import { PlaidService } from '../plaid/plaid.service'
import { Authorization } from '../security/transport/Authorization'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { TransactionService } from '../transaction/transaction.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, makeDinero, randomBetween } from '../utils/data.utils'
import { randomEnum, runAfter } from '../utils/test.utils'
import { AuthService } from './auth.service'
import { MINIMUM_PASSWORD_LENGTH } from './authentication.constants'
import { RelationshipService } from './relationship.service'
import { UserInviteService } from './user-invite.service'
import { ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY } from './user.constants'
import {
    DisclosureOfFeesDto,
    OnBoardingFeedback,
    OnBoardingSelection,
    PatchAddressDto,
    PatchLegalDocsDto,
    ProfilePhotoStatusDto,
    ProfilePhotoType,
    RecipientOfFundsFormDto,
    UserCredentialsDto,
    UserProfileDto
} from './user.dtos'
import { DisclosureOfFeesResponse, DwollaCustomerStatus, Role, User } from './user.entity'
import { UserSearchResult, UserService } from './user.service'

describe('User Controller', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let authService: AuthService
    let authorization: Authorization
    let loginLogService: LoginLogService
    let userService: UserService
    let userAccountService: UserAccountService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let s3Service: S3Service
    let configService: ConfigService
    let plaidService: PlaidService
    let dwollaService: DwollaService
    let emailService: EmailService
    let sharedExpenseService: SharedExpenseService
    let pushNotificationService: PushNotificationService
    let relationshipService: RelationshipService
    let deviceService: DeviceService
    let userInviteService: UserInviteService
    let linkTokenService: PlaidLinkTokenService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        authService = app.get<AuthService>(AuthService)
        loginLogService = app.get<LoginLogService>(LoginLogService)
        userService = app.get<UserService>(UserService)
        userAccountService = app.get<UserAccountService>(UserAccountService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        authorization = app.get<Authorization>(Provider.AUTHORIZATION_SERVICE)
        s3Service = app.get<S3Service>(S3Service)
        configService = app.get<ConfigService>(ConfigService)
        plaidService = app.get<PlaidService>(PlaidService)
        dwollaService = app.get<DwollaService>(DwollaService)
        emailService = app.get<EmailService>(EmailService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
        pushNotificationService = app.get<PushNotificationService>(PushNotificationService)
        relationshipService = app.get<RelationshipService>(RelationshipService)
        deviceService = app.get<DeviceService>(DeviceService)
        userInviteService = app.get<UserInviteService>(UserInviteService)
        linkTokenService = app.get<PlaidLinkTokenService>(PlaidLinkTokenService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    async function seedUserSet(numberOfUsers: number) {
        const users = []

        for (let i = 0; i < numberOfUsers; i++) {
            users.push(await seedService.seedUser())
        }

        return users
    }

    describe('GET /api/user', () => {
        it('Should find an existing user by auth token', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/user`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.id).toBe(user.id)
        })
        it("Should respond with forbidden when userProfile isn't found due to invalid token", async () => {
            //Create model instance that hasn't been persisted
            const user = await new User({
                id: 1,
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            })
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should respond with a dateTimeCreated', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    const responseUser: User = plainToClass(response.body, User)
                    expect(responseUser.dateTimeCreated).not.toBeNull()
                })
        })
        it('Should create a new plaid link token if the current one is expired', async () => {
            const user = await seedService.seedUser()
            const expiredToken = await seedService.seedPlaidLinkToken({
                userId: user.id,
                dateTimeTokenExpires: subDays(new Date(), 1)
            })
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/user`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            const tokens = await updatedUser.plaidLinkTokens
            const depositoryToken = tokens.find((token) => token.tokenType === PlaidTokenType.DEPOSITORY_ONLY)
            expect(expiredToken.plaidLinkToken).not.toBe(depositoryToken.plaidLinkToken)
            expect(depositoryToken.dateTimeTokenExpires.getTime()).toBeGreaterThan(
                expiredToken.dateTimeTokenExpires.getTime()
            )
        })

        describe(AuthenticationGuard.name, () => {
            it(`Should respond with ${HttpStatus.FORBIDDEN} if the user does not have a session token`, async () => {
                const user = await seedService.seedUser()
                user.sessionToken = null
                const token = authService.createBearerToken(user)
                // millisecond precision is lost in the database, so we're forced to pull out the seeded user
                // for an accurate comparison

                await supertest(app.getHttpServer())
                    .get(`/api/user`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.FORBIDDEN)
            })
            it(`It should respond with ${HttpStatus.FORBIDDEN} if the session id in the database does not match the session id in the header`, async () => {
                const user = await seedService.seedUser()
                const token = authService.createBearerToken(user)
                // millisecond precision is lost in the database, so we're forced to pull out the seeded user
                // for an accurate comparison

                await supertest(app.getHttpServer())
                    .get(`/api/user`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.FORBIDDEN)
            })
            it('Should set the session token back to null when a mismatched session id is sent via token', async () => {
                const user = await seedService.seedUser()
                const token = authService.createBearerToken(user)
                // millisecond precision is lost in the database, so we're forced to pull out the seeded user
                // for an accurate comparison

                await supertest(app.getHttpServer())
                    .get(`/api/user`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.FORBIDDEN)

                const updatedUser = await userService.findOneWhere({ id: user.id })
                expect(updatedUser.sessionToken).toBeNull()
            })
        })
    })

    describe('GET /api/user/search', () => {
        it('Should find users partially matching an email address', async () => {
            const user = await seedService.seedUser()
            const users = await seedUserSet(10)
            users.push(
                await seedService.seedUser(
                    new User({
                        email: 'matchme@gmail.com',
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'Robert',
                        lastName: 'Menke'
                    })
                )
            )
            const searchTerm = 'atch'
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { users }: UserSearchResult = response.body
                    expect(users.length).toBeGreaterThanOrEqual(1)
                    // @ts-ignore
                    const expectedUser = users.find((user) => user.email === 'matchme@gmail.com')
                    expect(expectedUser).not.toBeNull()
                })
        })
        it('Should find users partially matching a first name', async () => {
            const user = await seedService.seedUser()
            const users = await seedUserSet(10)
            users.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'Robert',
                        lastName: 'Menke'
                    })
                )
            )
            const searchTerm = 'ert'
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { users }: UserSearchResult = response.body
                    expect(users.length).toBeGreaterThanOrEqual(1)
                    // @ts-ignore
                    const expectedUser = users.find((user) => user.firstName === 'Robert')
                    expect(expectedUser).not.toBeNull()
                })
        })
        it('Should find users partially matching a last name', async () => {
            const user = await seedService.seedUser()
            const users = await seedUserSet(10)
            users.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'Robert',
                        lastName: 'Menke'
                    })
                )
            )
            const searchTerm = 'men'
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { users }: UserSearchResult = response.body
                    expect(users.length).toBeGreaterThanOrEqual(1)
                    // @ts-ignore
                    const expectedUser = users.find((user) => user.lastName === 'Menke')
                    expect(expectedUser).not.toBeNull()
                })
        })
        it('Should prioritize first name matches over last name and email matches', async () => {
            const user = await seedService.seedUser()
            const userList = []
            userList.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'Robert',
                        lastName: 'racecar'
                    })
                )
            )
            userList.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'racecar',
                        lastName: 'Menke'
                    })
                )
            )

            const searchTerm = 'racecar'
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { users }: UserSearchResult = response.body
                    expect(users).toHaveLength(2)
                    // @ts-ignore
                    expect(users[0].firstName).toBe('racecar')
                    // @ts-ignore
                    expect(users[1].firstName).toBe('Robert')
                })
        })
        it('Should find full name matches', async () => {
            const user = await seedService.seedUser()
            const userList = []
            userList.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'Robert',
                        lastName: 'Menke'
                    })
                )
            )
            userList.push(
                await seedService.seedUser(
                    new User({
                        email: faker.internet.email(),
                        password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                        firstName: 'racecar',
                        lastName: 'Menke'
                    })
                )
            )

            const searchTerm = 'Robert Me'
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const { users }: UserSearchResult = response.body
            expect(users).toHaveLength(1)
            // @ts-ignore
            expect(users[0].firstName).toBe('Robert')
            // @ts-ignore
            expect(users[0].lastName).toBe('Menke')
        })
        it('Should group users into the relationships key when a relationship exists', async () => {
            const user = await seedService.seedUser()
            const friend = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: 'Robert',
                    lastName: 'Menke'
                })
            )
            await seedService.seedRelationship(user, friend, BinaryStatus.IS_ACTIVE)
            const searchTerm = 'Robert'
            const token = user.sessionToken

            return await supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { friends, users }: UserSearchResult = response.body
                    expect(friends).toHaveLength(1)
                    expect(users).toHaveLength(0)
                    // @ts-ignore
                    expect(friends[0].firstName).toBe('Robert')
                })
        })
        it('Should include the authenticated user when requested', async () => {
            const user = await seedService.seedUser()
            const searchTerm = user.firstName
            const token = user.sessionToken

            return await supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}&includeAuthenticatedUser=true`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { friends, users }: UserSearchResult = response.body
                    expect(users).toHaveLength(1)
                    expect(friends).toHaveLength(0)
                })
        })
        it('Should never surface the placeholder account used for referencing deleted user transactions', async () => {
            const user = await seedService.seedUser()
            await seedService.seedHistoricalTransactionPull(user)
            await userService.createPlaceholderUserForDeletedUsersTransactionHistory()
            await seedUserSet(10)
            const searchTerm = ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/search?searchTerm=${searchTerm}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const { friends, users }: UserSearchResult = response.body
                    expect(users.length).toBe(0)
                    expect(friends.length).toBe(0)
                })
        })
    })

    describe('PATCH /api/user/name', () => {
        it('Should update the first and last name of a user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: UserProfileDto = {
                firstName: faker.name.fullName(),
                lastName: faker.name.lastName()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/name`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    expect(maybeUser.firstName).toBe(mockDto.firstName)
                    expect(maybeUser.lastName).toBe(mockDto.lastName)
                })
        })
        it('Should not overwrite password in the database (fixing bug with typeorm upgrade)', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            await supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.CREATED)
            const user = await runAfter(100, async () => await userService.findOneWhere({ email: userDto.email }))
            const token = user.sessionToken
            const mockDto: UserProfileDto = {
                firstName: faker.name.fullName(),
                lastName: faker.name.lastName()
            }

            await supertest(app.getHttpServer())
                .patch(`/api/user/name`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: user.email,
                    password: userDto.password
                })
                .expect(HttpStatus.CREATED)
        })
        it('Should not allow the first name to be missing', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: UserProfileDto = {
                firstName: '',
                lastName: faker.name.lastName()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/name`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.BAD_REQUEST)
        })
        it('Should not allow the last name to be missing', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: UserProfileDto = {
                firstName: faker.name.fullName(),
                lastName: ''
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/name`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /api/user/legal-doc-acceptance', () => {
        it('Should update the status of a particular legal doc', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: PatchLegalDocsDto = {
                acceptedPrivacyPolicy: faker.datatype.boolean(),
                acceptedTermsOfService: faker.datatype.boolean()
            }
            const response = await supertest(app.getHttpServer())
                .patch(`/api/user/legal-doc-acceptance`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            expect(response.body.acceptedPrivacyPolicy).toBe(dto.acceptedPrivacyPolicy)
            expect(response.body.acceptedTermsOfService).toBe(dto.acceptedTermsOfService)
            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.acceptedPrivacyPolicy).toBe(dto.acceptedPrivacyPolicy)
            expect(updatedUser.acceptedTermsOfService).toBe(dto.acceptedTermsOfService)
        })
    })

    describe('PATCH /api/user/recipient-of-funds', () => {
        it('Should patch recipient of funds data when supplied with a valid dto', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (res) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    expect(maybeUser.addressOne).toBe(dto.address.addressOne)
                    expect(maybeUser.addressTwo).toBe(dto.address.addressTwo)
                    expect(maybeUser.city).toBe(dto.address.city)
                    expect(maybeUser.state).toBe(dto.address.state)
                    expect(maybeUser.postalCode).toBe(dto.address.postalCode)
                    const date = new Date(Date.parse(dto.dateOfBirth))
                    expect(maybeUser.dateOfBirth.getFullYear()).toBe(date.getFullYear())
                    expect(maybeUser.dateOfBirth.getMonth()).toBe(date.getMonth())
                    expect(maybeUser.dateOfBirth.getDate()).toBe(date.getDate())
                    expect(maybeUser.lastFourOfSsn).toBe(dto.lastFourOfSsn)
                    expect(res.body.canReceiveFunds).toBe(true)
                })
        })
        it('Should set the hours in the date of birth to 0', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    expect(maybeUser.dateOfBirth.getHours()).toBe(0)
                })
        })
        it('Should reject updates to recipient of funds when the last 4 digits of a ssn is invalid', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(100, 999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.BAD_REQUEST)
        })
        it('Should upgrade a user to a verified Dwolla customer after completing the recipient of funds form', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    expect(maybeUser.dwollaCustomerStatus).toBe(DwollaCustomerStatus.VERIFIED)
                })
        })
        it("Should reject patching a verified customer's info if they're already verified", async () => {
            // For this business logic, see https://docs.dwolla.com/#update-a-customer
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            await supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)

            const patchDto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(patchDto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        })
        it('Should respond with a non-null city and state once an address has been patched', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (res) => {
                    const responseUser: User = plainToClass(res.body, User)
                    expect(responseUser.city).not.toBeNull()
                    expect(responseUser.state).not.toBeNull()
                })
        })
        it('Should set the reverification required flag to false when verification is successful', async () => {
            const user = await seedService.seedUser({
                dwollaReverificationNeeded: true
            })
            const token = user.sessionToken
            const dto: RecipientOfFundsFormDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: faker.address.secondaryAddress(),
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                },
                dateOfBirth: faker.date.past().toISOString(),
                lastFourOfSsn: randomBetween(1000, 9999).toString()
            }

            expect(user.dwollaReverificationNeeded).toBeTruthy()

            await supertest(app.getHttpServer())
                .patch(`/api/user/recipient-of-funds`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })

            if (!maybeUser) {
                fail('Failed to find userProfile')
            }

            expect(maybeUser.dwollaReverificationNeeded).toBeFalsy()
        })
    })

    describe('PATCH /api/user/address', () => {
        it("Should patch a user's address when supplied with a valid dto", async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: PatchAddressDto = {
                address: {
                    addressOne: faker.address.streetAddress(true),
                    addressTwo: null,
                    city: faker.address.city(),
                    state: faker.address.stateAbbr(),
                    postalCode: faker.address.zipCode()
                }
            }

            return supertest(app.getHttpServer())
                .patch(`/api/user/address`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    expect(maybeUser.addressOne).toBe(dto.address.addressOne)
                    expect(maybeUser.addressTwo).toBe(dto.address.addressTwo)
                    expect(maybeUser.city).toBe(dto.address.city)
                    expect(maybeUser.state).toBe(dto.address.state)
                    expect(maybeUser.postalCode).toBe(dto.address.postalCode)
                })
        })
    })

    describe('PATCH /api/user/disclosure-of-fees', () => {
        it('Should update the user response correctly', async () => {
            const user = await seedService.seedUser()
            const dto: DisclosureOfFeesDto = {
                response: randomEnum(DisclosureOfFeesResponse)
            }
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .patch(`/api/user/disclosure-of-fees`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.disclosureOfFeesResponse).toBe(dto.response)
        })
    })

    describe('PUT /api/user/register-device', () => {
        it('Should successfully register a device', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: DeviceRegistrationDto = {
                fcmToken: uuid(),
                deviceModel: uuid(),
                deviceOsVersion: uuid(),
                deviceOsName: uuid()
            }

            return supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.CREATED)
                .then(async () => {
                    const device = await user.devices
                    expect(device.length).toBe(1)
                })
        })
        it('Should allow multiple devices to be registered', async () => {
            const user = await seedService.seedUser()
            await seedService.seedUserDevice(user)
            const token = user.sessionToken
            // Using vehicles just to simulate make/model/version
            const dto: DeviceRegistrationDto = {
                fcmToken: uuid(),
                deviceModel: uuid(),
                deviceOsVersion: uuid(),
                deviceOsName: uuid()
            }

            return supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.CREATED)
                .then(async () => {
                    const device = await user.devices
                    expect(device.length).toBe(2)
                })
        })
        it('Should not register a duplicate device token for a given user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: DeviceRegistrationDto = {
                fcmToken: uuid(),
                deviceModel: uuid(),
                deviceOsVersion: uuid(),
                deviceOsName: uuid()
            }

            await supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.CREATED)

            await supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.CREATED)

            const devices = await user.devices
            expect(devices.length).toBe(1)
        })
        it('Should allow the same device token to be registered to multiple users', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: DeviceRegistrationDto = {
                fcmToken: uuid(),
                deviceModel: uuid(),
                deviceOsVersion: uuid(),
                deviceOsName: uuid()
            }

            await supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.CREATED)

            const nextUser = await seedService.seedUser()
            const nextToken = nextUser.sessionToken

            await supertest(app.getHttpServer())
                .put(`/api/user/register-device`)
                .set('Authorization', `Bearer ${nextToken}`)
                .send(dto)
                .expect(HttpStatus.CREATED)

            const devices = await user.devices
            expect(devices.length).toBe(1)
            const nextUserDevices = await nextUser.devices
            expect(nextUserDevices.length).toBe(1)
        })
    })

    describe('GET /api/user/pre-signed-photo-upload-url', () => {
        it('Should create a pre-signed upload url for a user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get('/api/user/pre-signed-photo-upload-url')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body).toHaveProperty('preSignedUrl')
                    expect(response.body.preSignedUrl.length).toBeGreaterThan(0)
                    expect(response.body.preSignedUrl.includes('avatar')).toBe(true)
                    expect(response.body.preSignedUrl.includes('cover_photo')).toBe(false)
                })
        })
        it('Should create a pre-signed upload url for a user uploading a cover photo', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/pre-signed-photo-upload-url?photoType=COVER_PHOTO`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body).toHaveProperty('preSignedUrl')
                    expect(response.body.preSignedUrl.length).toBeGreaterThan(0)
                    expect(response.body.preSignedUrl.includes('avatar')).toBe(false)
                    expect(response.body.preSignedUrl.includes('cover_photo')).toBe(true)
                })
        })
    })

    describe('GET /api/user/pre-signed-photo-download-url', () => {
        it('Should create a pre-signed download url for a user', async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(context.withUserHavingProfilePhoto)
            const token = context.getUser().sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/pre-signed-photo-download-url?userId=${context.getUser().id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body).toHaveProperty('preSignedUrl')
                    expect(response.body.preSignedUrl.length).toBeGreaterThan(0)
                })
        })
        it("Should allow a signed in user to fetch a presigned download url for another user's profile photo", async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(context.withUserHavingProfilePhoto)
            const user = await seedService.seedUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/user/pre-signed-photo-download-url?userId=${context.getUser().id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body).toHaveProperty('preSignedUrl')
                    expect(response.body.preSignedUrl.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with a null presigned url when the user has not uploaded a profile photo', async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(context.withUser)
            const token = context.getUser().sessionToken

            return supertest(app.getHttpServer())
                .get('/api/user/pre-signed-photo-download-url')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body).toHaveProperty('preSignedUrl')
                    expect(response.body.preSignedUrl).toBeNull()
                })
        })
    })

    describe('PATCH /api/user/photo-upload-complete', () => {
        it('Should set the status of a profile photo upload when a new one is uploaded', async () => {
            const user = await seedService.seedUser()
            await seedService.uploadSamplePhoto(user, ProfilePhotoType.AVATAR)
            const token = user.sessionToken
            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: true,
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.AVATAR
            }

            return supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const patchedUser = await userService.findOneWhere({ id: user.id })
                    expect(patchedUser).not.toBeNull()
                    expect(patchedUser.profilePhotoUploadCompleted).toBe(dto.profilePhotoUploadComplete)
                    expect(patchedUser.profilePhotoMimeType).toBe(dto.mimeType)
                })
        })
        it('Should set the status of a profile photo when the upload is not complete', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: false,
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.AVATAR
            }

            return supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const patchedUser = await userService.findOneWhere({ id: user.id })
                    expect(patchedUser).not.toBeNull()
                    expect(patchedUser.profilePhotoUploadCompleted).toBe(dto.profilePhotoUploadComplete)
                    expect(patchedUser.profilePhotoMimeType).toBeNull()
                })
        })
        it('Should set the profile photo mime type to null when the upload is marked as incomplete', async () => {
            const user = await seedService.seedUser()
            await seedService.uploadSamplePhoto(user, ProfilePhotoType.AVATAR)
            await userService.setPhotoUploadStatus(user, {
                profilePhotoUploadComplete: true,
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.AVATAR
            })
            const token = user.sessionToken
            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: false,
                photoType: ProfilePhotoType.AVATAR
            }

            return supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const patchedUser = await userService.findOneWhere({ id: user.id })
                    expect(patchedUser).not.toBeNull()
                    expect(patchedUser.profilePhotoUploadCompleted).toBe(dto.profilePhotoUploadComplete)
                    expect(patchedUser.profilePhotoMimeType).toBeNull()
                })
        })
        it('Should set the status of a cover photo upload', async () => {
            const user = await seedService.seedUser()
            await seedService.uploadSamplePhoto(user, ProfilePhotoType.COVER_PHOTO)
            const token = user.sessionToken
            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: faker.datatype.boolean(),
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.COVER_PHOTO
            }

            return supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const patchedUser = await userService.findOneWhere({ id: user.id })
                    expect(patchedUser).not.toBeNull()
                    expect(patchedUser.coverPhotoUploadCompleted).toBe(dto.profilePhotoUploadComplete)
                    if (dto.profilePhotoUploadComplete) {
                        expect(patchedUser.coverPhotoMimeType).toBe(dto.mimeType)
                    } else {
                        expect(patchedUser.coverPhotoMimeType).toBeNull()
                    }
                })
        })
        it(`Should capture a hash for profile photo uploads`, async () => {
            let context = TestingContext.fromApp(app)
            await context.withUserHavingProfilePhoto()
            const token = context.getUser().sessionToken
            const user = context.getUser()
            const hash = await s3Service.hashFile({
                Key: `avatar/${user.uuid}`,
                Bucket: configService.get(Environment.S3_PHOTOS_BUCKET)
            })

            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: true,
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.AVATAR
            }

            await supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.profilePhotoSha256Hash).toBe(hash)
        })
        it('Should capture a hash for cover photo uploads', async () => {
            let context = TestingContext.fromApp(app)
            await context.withUserHavingCoverPhoto()
            const token = context.getUser().sessionToken
            const user = context.getUser()
            const hash = await s3Service.hashFile({
                Key: `cover_photo/${user.uuid}`,
                Bucket: configService.get(Environment.S3_PHOTOS_BUCKET)
            })

            const dto: ProfilePhotoStatusDto = {
                profilePhotoUploadComplete: true,
                mimeType: faker.system.mimeType(),
                photoType: ProfilePhotoType.COVER_PHOTO
            }

            await supertest(app.getHttpServer())
                .patch('/api/user/photo-upload-status')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.coverPhotoSha256Hash).toBe(hash)
        })
    })

    describe('PATCH /api/user/on-boarding-feedback', () => {
        it('Should successfully update the on-boarding feedback provided by a user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const dto: OnBoardingFeedback = {
                selection: OnBoardingSelection.SPLIT_BILLS,
                additionalFeedback: 'foo bar baz'
            }

            await supertest(app.getHttpServer())
                .patch('/api/user/on-boarding-feedback')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.onBoardingSelection).toBe(dto.selection)
            expect(updatedUser.onBoardingAdditionalFeedback).toBe(dto.additionalFeedback)
        })
        it('Should never override additional feedback provided by a user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            // @ts-ignore
            await userService.save({
                ...user,
                onBoardingSelection: OnBoardingSelection.SPLIT_BILLS,
                onBoardingAdditionalFeedback: 'foo bar baz'
            })

            const dto: OnBoardingFeedback = {
                selection: OnBoardingSelection.CHARGING_TENANTS,
                additionalFeedback: null
            }

            await supertest(app.getHttpServer())
                .patch('/api/user/on-boarding-feedback')
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            expect(updatedUser.onBoardingSelection).toBe(dto.selection)
            expect(updatedUser.onBoardingAdditionalFeedback).toBe('foo bar baz')
        })
    })

    describe('GET /api/user/balance', () => {
        it('Should respond with a balance for a user', async () => {
            const user = await seedService.seedUser()
            await seedService.seedUserAccount(user)

            const response = await supertest(app.getHttpServer())
                .get('/api/user/balance')
                .set('Authorization', `Bearer ${user.sessionToken}`)
                .expect(HttpStatus.OK)

            const body = response.body as Balance[]
            const balance = body[0]
            const dinero = makeDinero(DwollaServiceFake.CUSTOMER_BALANCE)
            expect(balance.dineroValueRepresentation).toBe(dinero.getAmount())
            expect(balance.value).toBe(dinero.toFormat('0,0.00'))
        })
    })

    describe('GET /api/user/:id/relationships', () => {
        it('Should find a users relationships', async () => {
            const user = await seedService.seedUser()
            const friend = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: 'Robert',
                    lastName: 'Menke'
                })
            )
            //Seed a non-friend
            await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: faker.lorem.word(),
                    lastName: faker.lorem.word()
                })
            )
            await seedService.seedRelationship(user, friend, BinaryStatus.IS_ACTIVE)
            const token = user.sessionToken

            return await supertest(app.getHttpServer())
                .get(`/api/user/${user.id}/relationships`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const body: User[] = response.body
                    expect(body.length).toBe(1)
                    expect(body[0].id).toBe(friend.id)
                })
        })
        it('Should respond with an empty array when a user has no relationships', async () => {
            const user = await seedService.seedUser()
            await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: 'Robert',
                    lastName: 'Menke'
                })
            )
            //Seed a non-friend
            await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: faker.lorem.word(),
                    lastName: faker.lorem.word()
                })
            )
            const token = user.sessionToken

            return await supertest(app.getHttpServer())
                .get(`/api/user/${user.id}/relationships`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    const body: User[] = response.body
                    expect(body.length).toBe(0)
                })
        })
    })

    describe('GET /api/user/:id', () => {
        it('Should find a user when a valid id is supplied', async () => {
            const user = await seedService.seedUser()
            const admin = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName(),
                    role: Role.ADMIN
                })
            )
            const token = admin.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.id).toBe(user.id)
        })
        it(`Should throw ${HttpStatus.NOT_FOUND} when an invalid user is supplied`, async () => {
            const admin = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName(),
                    role: Role.ADMIN
                })
            )
            const token = admin.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/user/9999`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /api/user/:id', () => {
        const TIME_ALLOWED_FOR_DELETION_TO_RUN = 10_000
        /**
         * NB: `TestingContext` is generally an unwieldy API and was originally intended
         *     to reduce boilerplate for common testing scenarios. Using it here to reduce
         *     boilerplate is still probably good, but mixing shared bills and recurring
         *     payments with this API messes up some internal state within `TestingContext`.
         *
         *     Don't make any assertions within this test block based on the state of the
         *     context object. Refer to the database as the source of truth after using this
         *     object.
         */
        async function createUserWithRecordsInAllTables(): Promise<TestingContext> {
            let context = TestingContext.fromApp(app)
            await context.chain(
                context.withTransactionHistory,
                context.withUserDevice,
                context.withLinkedBankAccount,
                context.withLoginLogs,
                context.withPayee,
                context.withPayeeDevice,
                context.withRelationship,
                context.withUserInvite,
                context.withPlaidLinkTokens,
                async () => {
                    await context.withSharedBill(BinaryStatus.IS_ACTIVE)
                    await context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
                    await context.withSharedExpenseTransaction(true)
                    await context.withPendingSharedExpenseTransaction()
                    await context.withWithheldTransaction(subDays(new Date(), 1))
                },
                () => context.withPushNotifications({}, 5)
            )

            await context.withRecurringPayment(BinaryStatus.IS_ACTIVE)
            await context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            const recurringPayment = context.getSharedExpense()
            await context.withSharedExpenseTransactionFromSharedExpense(recurringPayment)

            // Ensures we have a placeholder user + account ready to fill in for deleted accounts
            await userService.onModuleInit()

            return context
        }

        it(`Should not allow users to delete accounts that don't belong to them`, async () => {
            const context = await createUserWithRecordsInAllTables()
            const user = await seedService.seedAdmin()
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .delete(`/api/user/${context.getUser().id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should remove all plaid items associated with the account', async () => {
            const spy = jest.spyOn(plaidService, 'removeAccount')
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken
            const allPlaidItems = await userAccountService.findWhere({
                userId: user.id,
                isActive: true
            })

            expect(allPlaidItems.length).toBeGreaterThan(0)

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, () => {
                expect(spy.mock.calls.length).toBe(allPlaidItems.length)
            })
        }, 60_000)
        it('Should cancel any Dwolla transfers in progress', async () => {
            const spy = jest.spyOn(dwollaService, 'cancelTransfer')
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken
            const allTransfersInProgress = await sharedExpenseService.findManyTransactionsBy([
                {
                    destinationUserId: user.id,
                    dwollaStatus: DwollaTransferStatus.PENDING
                },
                {
                    sourceUserId: user.id,
                    dwollaStatus: DwollaTransferStatus.PENDING
                }
            ])

            expect(allTransfersInProgress.length).toBeGreaterThan(0)

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, () => {
                expect(spy.mock.calls.length).toBe(allTransfersInProgress.length)
            })
        }, 60_000)
        it('Should remove all Dwolla funding sources', async () => {
            const spy = jest.spyOn(dwollaService, 'removeFundingSource')
            const deactivationSpy = jest.spyOn(dwollaService, 'deactivateCustomer')
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken
            const accounts = await userAccountService.getAccountsForUser(user)

            expect(accounts.length).toBeGreaterThan(0)

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, () => {
                expect(spy.mock.calls.length).toBe(accounts.length)
                expect(deactivationSpy.mock.calls.length).toBe(1)
            })
        }, 60_000)
        it('Should deactivate all shared bills, replace the user with the dedicated placeholder account and send notifications to all other participating users', async () => {
            const pushNotificationSpy = jest.spyOn(pushNotificationService, 'sendNotification')
            const emailServiceSpy = jest.spyOn(emailService, 'sendNotificationEmail')
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken
            const activeSharedBills = await sharedExpenseService.getSharedExpensesForUser(user, {
                isActive: true
            })
            expect(activeSharedBills.length).toBeGreaterThan(0)

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, async () => {
                const activeSharedBills = await sharedExpenseService.getSharedExpensesForUser(user, {
                    isActive: true
                })
                const activeAgreements = await sharedExpenseService.getSharedExpenseUserAgreements(user, {
                    isActive: true
                })

                expect(activeSharedBills.length).toBe(0)
                expect(activeAgreements.length).toBe(0)
                expect(pushNotificationSpy.mock.calls.length).toBe(activeAgreements.length)
                expect(emailServiceSpy.mock.calls.length).toBe(activeAgreements.length)
            })
        }, 60_000)
        it('Should send the user an email when their account has been deleted', async () => {
            const spy = jest.spyOn(emailService, 'sendAccountDeletionEmail')
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, () => {
                expect(spy.mock.calls.length).toBe(1)
            })
        }, 60_000)
        it('Should delete relationships, push notifications, user devices, user invites, login logs, accounts, and the user themselves', async () => {
            const context = await createUserWithRecordsInAllTables()
            const user = context.getUser()
            const token = user.sessionToken
            const activeRelationships = await relationshipService.findRelationships(user)
            const devices = await user.devices
            const pushNotifications = await pushNotificationService.findWhere({
                deviceId: In(devices.map((device) => device.id))
            })
            const invites = await userInviteService.findWhere({
                initiatingUserId: user.id
            })
            const loginLogs = await loginLogService.find(user)
            const accounts = await userAccountService.findWhere({
                userId: user.id
            })
            const tokens = await linkTokenService.findForUser(user)

            expect(activeRelationships.length).toBeGreaterThan(0)
            expect(devices.length).toBeGreaterThan(0)
            expect(pushNotifications.length).toBeGreaterThan(0)
            expect(invites.length).toBeGreaterThan(0)
            expect(loginLogs.length).toBeGreaterThan(0)
            expect(accounts.length).toBeGreaterThan(0)
            expect(tokens.length).toBeGreaterThan(0)

            await supertest(app.getHttpServer())
                .delete(`/api/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.ACCEPTED)

            await runAfter(TIME_ALLOWED_FOR_DELETION_TO_RUN, async () => {
                const activeRelationships = await relationshipService.findRelationships(user)
                const devices = await deviceService.findWhere({ userId: user.id })
                const pushNotifications = await pushNotificationService.findWhere({
                    deviceId: In(devices.map((device) => device.id))
                })
                const invites = await userInviteService.findWhere({
                    initiatingUserId: user.id
                })
                const loginLogs = await loginLogService.find(user)
                const accounts = await userAccountService.findWhere({
                    userId: user.id
                })
                const userThatShouldNotExist = await userService.findOne({
                    where: {
                        id: user.id
                    }
                })
                const tokens = await linkTokenService.findForUser(user)

                expect(activeRelationships.length).toBe(0)
                expect(devices.length).toBe(0)
                expect(pushNotifications.length).toBe(0)
                expect(invites.length).toBe(0)
                expect(loginLogs.length).toBe(0)
                expect(accounts.length).toBe(0)
                expect(userThatShouldNotExist).toBeNull()
                expect(tokens.length).toBe(0)
            })
        }, 60_000)
    })
})
