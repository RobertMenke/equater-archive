import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { subDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { Provider } from '../config/config.service'
import { LoginLogService } from '../login_log/login-log.service'
import { PlaidTokenType } from '../plaid/plaid-token-type'
import { Authorization } from '../security/transport/Authorization'
import { SeedingService } from '../seeding/seeding.service'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { CommunicationGateway } from '../socket/communication.gateway'
import { TransactionService } from '../transaction/transaction.service'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { UserAccountService } from '../user_account/user-account.service'
import { runAfter } from '../utils/test.utils'
import { AuthService } from './auth.service'
import { MINIMUM_PASSWORD_LENGTH } from './authentication.constants'
import { Relationship } from './relationship.entity'
import { RelationshipService } from './relationship.service'
import { UserInviteService } from './user-invite.service'
import { ProfilePhotoType, SessionTokenDto, UserCredentialsDto } from './user.dtos'
import { DwollaCustomerStatus, Role, User } from './user.entity'
import { UserService } from './user.service'

describe('Authentication Controller', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let authService: AuthService
    let loginLogService: LoginLogService
    let userService: UserService
    let userAccountService: UserAccountService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let vendorService: VendorService
    let relationshipService: RelationshipService
    let authorization: Authorization

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        authService = app.get<AuthService>(AuthService)
        loginLogService = app.get<LoginLogService>(LoginLogService)
        userService = app.get<UserService>(UserService)
        userAccountService = app.get<UserAccountService>(UserAccountService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        vendorService = app.get<VendorService>(VendorService)
        relationshipService = app.get<RelationshipService>(RelationshipService)
        authorization = app.get<Authorization>(Provider.AUTHORIZATION_SERVICE)
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

    describe('PUT /api/auth/register', () => {
        it('Should register a user successfully', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer())
                .put(`/api/auth/register`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('authToken')
                    expect(res.body).toHaveProperty('user')
                    expect(res.body.user).toHaveProperty('id')
                    expect(res.body.user).toHaveProperty('email')
                    expect(res.body.user).toHaveProperty('emailIsConfirmed')
                })
        })
        it('Should subsequently verify password after registration', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            await supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.CREATED)
            await supertest(app.getHttpServer()).post(`/api/auth/login`).send(userDto).expect(HttpStatus.CREATED)
        })
        it('Should mark an invited user as converted if the user registering has an outstanding invite', async () => {
            const inviteInitiatingUser = await seedService.seedUser()
            const userAccount = await seedService.seedUserAccount(inviteInitiatingUser)
            await seedService.seedHistoricalTransactionPull(inviteInitiatingUser)
            const vendor = (await vendorService.getUniqueVendors()).pop()
            const sharedExpense = await seedService.seedSharedBill(inviteInitiatingUser, userAccount, vendor)
            const userInvite = await seedService.seedUserInvite(
                inviteInitiatingUser,
                sharedExpense,
                faker.internet.email()
            )
            const userDto: UserCredentialsDto = {
                email: userInvite.email,
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer())
                .put(`/api/auth/register`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then(async (_) => {
                    const inviteService = app.get<UserInviteService>(UserInviteService)
                    const invite = await inviteService.getInviteByUuid(userInvite.uuid)
                    expect(invite.isConverted).toBe(true)
                    expect(invite.dateTimeBecameUser).not.toBeNull()
                })
        })
        it('Should create a confirmed relationship between the invited user and the user that initiated the invite', async () => {
            const inviteInitiatingUser = await seedService.seedUser()
            const userAccount = await seedService.seedUserAccount(inviteInitiatingUser)
            await seedService.seedHistoricalTransactionPull(inviteInitiatingUser)
            const vendor = (await vendorService.getUniqueVendors()).pop()
            const sharedExpense = await seedService.seedSharedBill(inviteInitiatingUser, userAccount, vendor)
            const userInvite = await seedService.seedUserInvite(
                inviteInitiatingUser,
                sharedExpense,
                faker.internet.email()
            )
            const userDto: UserCredentialsDto = {
                email: userInvite.email,
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer())
                .put(`/api/auth/register`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then(async (_) => {
                    const consentingUser = await userService.findOneWhere({ email: userDto.email })
                    expect(consentingUser).not.toBeNull()
                    const relationship = await relationshipService.findRelationship(
                        inviteInitiatingUser,
                        consentingUser
                    )
                    expect(relationship).toBeInstanceOf(Relationship)
                })
        })
        it('Should, by default, create the user with DwollaCustomerStatus.NONE', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer())
                .put(`/api/auth/register`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then(async (_) => {
                    const user = await userService.findOneWhere({ email: userDto.email })
                    expect(user).not.toBeNull()
                    expect(user.dwollaCustomerStatus).toBe(DwollaCustomerStatus.NONE)
                })
        })
        it('Should retrieve the "story" of the expense agreement if the user has an outstanding expense agreement to address after registering as a user with outstanding invites', async () => {
            const inviteInitiatingUser = await seedService.seedUser()
            const userAccount = await seedService.seedUserAccount(inviteInitiatingUser)
            await transactionPullService.parseHistoricalTransactionPull(inviteInitiatingUser)
            const vendor = (await vendorService.getUniqueVendors()).pop()
            const sharedExpense = await seedService.seedSharedBill(inviteInitiatingUser, userAccount, vendor)
            const userInvite = await seedService.seedUserInvite(
                inviteInitiatingUser,
                sharedExpense,
                faker.internet.email()
            )
            const userDto: UserCredentialsDto = {
                email: userInvite.email,
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer())
                .put(`/api/auth/register`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body.userAgreementStories).not.toBeNull()
                    expect(res.body.userAgreementStories.length).toBeGreaterThan(0)
                })
        })
        it('Should fail to register when a userProfile with the same email already exists', async () => {
            const user = await seedService.seedUser()
            const userDto: UserCredentialsDto = {
                email: user.email,
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            return supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.BAD_REQUEST)
        })
        it("Should fail to register when a userProfile supplies password that doesn't meet the length requirement", async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(7)
            }

            return supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.BAD_REQUEST)
        })
        it('Should create a plaid link token', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            await supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.CREATED)

            const user = await userService.findOneWhere({ email: userDto.email })
            const tokens = await user.plaidLinkTokens
            expect(tokens.length).toBe(4)
            const depositoryToken = tokens.find((token) => token.tokenType === PlaidTokenType.DEPOSITORY_ONLY)
            expect(depositoryToken.dateTimeTokenExpires.getTime()).toBeGreaterThan(new Date().getTime())
        })
        it('Should create a plaid link credit and depository token', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            await supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.CREATED)

            const user = await userService.findOneWhere({ email: userDto.email })
            const tokens = await user.plaidLinkTokens
            expect(tokens.length).toBe(4)
            const tokenTypes = [
                tokens.find((token) => token.tokenType === PlaidTokenType.DEPOSITORY_ONLY),
                tokens.find((token) => token.tokenType === PlaidTokenType.ANDROID_DEPOSITORY_ONLY),
                tokens.find((token) => token.tokenType === PlaidTokenType.CREDIT_AND_DEPOSITORY),
                tokens.find((token) => token.tokenType === PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY)
            ]

            tokenTypes.forEach((token) => {
                expect(token).not.toBeNull()
                expect(token.dateTimeTokenExpires.getTime()).toBeGreaterThan(new Date().getTime())
            })
        })
        it('Should store a session token when registration is successful', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }

            await supertest(app.getHttpServer()).put(`/api/auth/register`).send(userDto).expect(HttpStatus.CREATED)

            await runAfter(1000, async () => {
                const user = await userService.findOneWhere({ email: userDto.email })
                expect(user.sessionToken).not.toBeNull()
            })
        })
    })

    describe('POST /api/auth/login', () => {
        it('Should login with valid credentials', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser(new User(userDto))

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('authToken')
                })
        })
        it("Should log the user's login in the LoginLog table", async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser(new User(userDto))

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then(async () => {
                    const logs = await loginLogService.find(user)
                    expect(logs).toHaveLength(1)
                })
        })
        it('Should respond with 401 when login is unsuccessful', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser(new User(userDto))

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    ...userDto,
                    password: userDto.password + 'a'
                })
                .expect(HttpStatus.UNAUTHORIZED)
        })
        it('Should response with a null preSignedDownloadUrl when no photo is on record', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser(new User(userDto))

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body.user).toHaveProperty('preSignedPhotoDownloadUrl')
                    expect(res.body.user.preSignedPhotoDownloadUrl).toBeNull()
                })
        })
        it('Should response with a valid preSignedDownloadUrl when a photo has been uploaded', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser({
                ...userDto,
                profilePhotoUploadCompleted: true,
                profilePhotoMimeType: faker.system.mimeType()
            })
            await seedService.uploadSamplePhoto(user, ProfilePhotoType.AVATAR)

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body.user).toHaveProperty('preSignedPhotoDownloadUrl')
                    expect(res.body.user.preSignedPhotoDownloadUrl.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with the current active linked bank account when one is available', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser(new User(userDto))
            await seedService.seedUserAccount(user)

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('userAccounts')
                    expect(res.body.userAccounts.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with a null userAccount when there is no active linked account', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser(new User(userDto))

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('userAccounts')
                    expect(res.body.userAccounts.length).toBe(0)
                })
        })
        it('Should create a new plaid link token if the current token is expired', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser(new User(userDto))
            const linkToken = await seedService.seedPlaidLinkToken({
                userId: user.id,
                dateTimeTokenExpires: subDays(new Date(), 1)
            })

            await supertest(app.getHttpServer()).post(`/api/auth/login`).send(userDto).expect(HttpStatus.CREATED)

            const updatedUser = await userService.findOneWhere({ id: user.id })
            const plaidTokens = await updatedUser.plaidLinkTokens
            const depositoryToken = plaidTokens.find((token) => token.tokenType === PlaidTokenType.DEPOSITORY_ONLY)
            expect(depositoryToken.plaidLinkToken).not.toBe(linkToken.plaidLinkToken)
            expect(depositoryToken.dateTimeTokenExpires.getTime()).toBeGreaterThan(
                linkToken.dateTimeTokenExpires.getTime()
            )
        })
        it('Should store a session token during login if one does not already exist', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const userBeforeLogin = await userService.save(new User(userDto))

            await supertest(app.getHttpServer()).post(`/api/auth/login`).send(userDto).expect(HttpStatus.CREATED)

            const user = await userService.findOneWhere({ email: userDto.email })
            await runAfter(1000, async () => {
                expect(userBeforeLogin.sessionToken).toBeNull()
                expect(user.sessionToken).not.toBeNull()
            })
        })
        it('Should not overwrite a session token during login if one already exists', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const entity = new User(userDto)
            entity.sessionToken = authService.createBearerToken(entity)
            await userService.save(entity)

            await supertest(app.getHttpServer()).post(`/api/auth/login`).send(userDto).expect(HttpStatus.CREATED)

            const user = await userService.findOneWhere({ email: userDto.email })
            await runAfter(1000, async () => {
                expect(user.sessionToken).toBe(entity.sessionToken)
            })
        })
    })

    describe('POST /api/auth/admin-login', () => {
        it('Should login with valid credentials', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('authToken')
                    expect(typeof res.body.authToken).toBe('string')
                })
        })
        it("Should log the user's login in the LoginLog table", async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then(async () => {
                    const logs = await loginLogService.find(user)
                    expect(logs).toHaveLength(1)
                })
        })
        it('Should respond with 401 when login is unsuccessful', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send({
                    ...userDto,
                    password: userDto.password + 'a'
                })
                .expect(HttpStatus.UNAUTHORIZED)
        })
        it('Should response with a null preSignedDownloadUrl when no photo is on record', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body.user).toHaveProperty('preSignedPhotoDownloadUrl')
                    expect(res.body.user.preSignedPhotoDownloadUrl).toBeNull()
                })
        })
        it('Should response with a valid preSignedDownloadUrl when a photo has been uploaded', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN,
                profilePhotoUploadCompleted: true,
                profilePhotoMimeType: faker.system.mimeType()
            })
            await seedService.uploadSamplePhoto(user, ProfilePhotoType.AVATAR)

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body.user).toHaveProperty('preSignedPhotoDownloadUrl')
                    expect(res.body.user.preSignedPhotoDownloadUrl.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with the current active linked bank account when one is available', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })
            await seedService.seedUserAccount(user)

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('userAccounts')
                    expect(res.body.userAccounts.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with a null userAccount when there is no active linked account', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            return supertest(app.getHttpServer())
                .post(`/api/auth/login`)
                .send(userDto)
                .expect(HttpStatus.CREATED)
                .then((res) => {
                    expect(res.body).toHaveProperty('userAccounts')
                    expect(res.body.userAccounts.length).toBe(0)
                })
        })
        it('Should respond with 403 when the user is not an admin', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            await seedService.seedUser(userDto)

            return supertest(app.getHttpServer())
                .post(`/api/auth/admin-login`)
                .send(userDto)
                .expect(HttpStatus.FORBIDDEN)
        }, 30000)
        it('Should create a session token if one does not exist', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = new User({
                ...userDto,
                role: Role.ADMIN
            })
            await userService.save(user)

            await supertest(app.getHttpServer()).post(`/api/auth/admin-login`).send(userDto).expect(HttpStatus.CREATED)

            await runAfter(1000, async () => {
                expect(user.sessionToken).toBeNull()
                const userAfterLogin = await userService.findOneWhere({ email: userDto.email })
                expect(userAfterLogin.sessionToken).not.toBeNull()
            })
        })
        it('Should not overwrite a session token if one already exists', async () => {
            const userDto: UserCredentialsDto = {
                email: faker.internet.email(),
                password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
            }
            const user = await seedService.seedUser({
                ...userDto,
                role: Role.ADMIN
            })

            await supertest(app.getHttpServer()).post(`/api/auth/admin-login`).send(userDto).expect(HttpStatus.CREATED)

            await runAfter(1000, async () => {
                const userAfterLogin = await userService.findOneWhere({ email: userDto.email })
                const originalTokenDto = authorization.extractData<SessionTokenDto>(user.sessionToken)
                const tokenAfterLoginDto = authorization.extractData<SessionTokenDto>(userAfterLogin.sessionToken)
                expect(originalTokenDto.sessionId).toBe(tokenAfterLoginDto.sessionId)
            })
        })
    })

    describe('GET /api/auth/verify-email/:uuid', () => {
        it('Should verify an email when supplied with valid parameters', async () => {
            const user = await seedService.seedUser()

            return supertest(app.getHttpServer())
                .get(`/api/auth/verify-email/${user.emailVerificationCode}`)
                .expect(HttpStatus.OK)
        })
        it('Should fail to verify incorrect email verification token', async () => {
            await seedService.seedUser()

            return supertest(app.getHttpServer()).get(`/api/auth/verify-email/${uuid()}`).expect(HttpStatus.NOT_FOUND)
        })
        it('Should fail to verify expired email verification token', async () => {
            const user = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(),
                    emailIsConfirmed: false,
                    emailVerificationCode: uuid(),
                    emailVerificationExpirationDate: subDays(new Date(), 1)
                })
            )

            return supertest(app.getHttpServer())
                .get(`/api/auth/verify-email/${user.emailVerificationCode}`)
                .expect(HttpStatus.UNAUTHORIZED)
        })
        it('Should broadcast the email confirmation event over a websocket', async () => {
            const socketGateway = app.get<CommunicationGateway>(CommunicationGateway)
            const spy = jest.spyOn(socketGateway, 'sendMessage')
            const user = await seedService.seedUser()

            await supertest(app.getHttpServer())
                .get(`/api/auth/verify-email/${user.emailVerificationCode}`)
                .expect(HttpStatus.OK)

            await runAfter(1000, () => {
                expect(spy.mock.calls.length).toBe(1)
            })
        })
    })

    describe('POST /api/auth/resend-email-verification', () => {
        it('Should resend email verification when supplied a valid email', async () => {
            const user = await seedService.seedUser()

            return supertest(app.getHttpServer())
                .post(`/api/auth/resend-email-verification`)
                .send({
                    email: user.email
                })
                .expect(HttpStatus.CREATED)
        })
    })

    describe('POST /api/auth/password-reset', () => {
        it('Should allow password reset with valid reset token', async () => {
            let user = await seedService.seedUser()
            user = await userService.updatePasswordResetCode(user)

            return supertest(app.getHttpServer())
                .post(`/api/auth/password-reset`)
                .send({
                    uuid: user.passwordResetCode,
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
                })
                .expect(HttpStatus.CREATED)
        })
        it('Should disallow password reset with invalid or expired token', async () => {
            const user = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(),
                    emailIsConfirmed: false,
                    passwordResetCode: uuid(),
                    passwordResetExpirationDate: subDays(new Date(), 1)
                })
            )

            return supertest(app.getHttpServer())
                .post(`/api/auth/password-reset`)
                .send({
                    uuid: user.passwordResetCode,
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
                })
                .expect(HttpStatus.UNAUTHORIZED)
        })
    })
})
