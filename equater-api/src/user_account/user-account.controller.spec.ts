import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getRepositoryToken } from '@nestjs/typeorm'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { DwollaServiceFake } from '../dwolla/dwolla.service.fake'
import { LoginLogService } from '../login_log/login-log.service'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidTokenType } from '../plaid/plaid-token-type'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import {
    PLAID_TEST_ACCOUNT_WITH_ACH_ID,
    PLAID_TEST_ACCOUNT_WITH_ACH_ID_2,
    PLAID_TEST_ACCOUNT_WITH_ACH_MASK_2,
    PLAID_TEST_ACCOUNT_WITH_ACH_NAME_2
} from '../test.constants'
import { TransactionService } from '../transaction/transaction.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { AuthService } from '../user/auth.service'
import { MINIMUM_PASSWORD_LENGTH } from '../user/authentication.constants'
import { DwollaIntegrationService } from '../user/dwolla-integration.service'
import { LinkBankAccountDto } from '../user/user.dtos'
import { DwollaCustomerStatus, Role, User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { BinaryStatus, mapAsync } from '../utils/data.utils'
import { SerializedUserAccount, UserAccount } from './user-account.entity'
import { UserAccountService } from './user-account.service'

describe('User Account Controller', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let authService: AuthService
    let loginLogService: LoginLogService
    let userService: UserService
    let userAccountService: UserAccountService
    let transactionPullService: TransactionPullService
    let transactionService: TransactionService
    let configService: ConfigService
    let plaidLinkTokenService: PlaidLinkTokenService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        authService = app.get<AuthService>(AuthService)
        loginLogService = app.get<LoginLogService>(LoginLogService)
        userService = app.get<UserService>(UserService)
        userAccountService = app.get<UserAccountService>(UserAccountService)
        transactionPullService = app.get<TransactionPullService>(TransactionPullService)
        transactionService = app.get<TransactionService>(TransactionService)
        configService = app.get<ConfigService>(ConfigService)
        plaidLinkTokenService = app.get<PlaidLinkTokenService>(PlaidLinkTokenService)
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

    function createLinkBankAccountDto(accountId: string = uuid()): LinkBankAccountDto {
        return {
            token: uuid(),
            metaData: {
                account: {
                    id: accountId,
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
    }

    describe('GET /api/account', () => {
        it('Should retrieve all active accounts for a given user', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const response = await supertest(app.getHttpServer())
                .get(`/api/account`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.length).toBe(2)
        })
        it('Should retrieve new plaid tokens if necessary', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const accounts = await userAccountService.getAccountsForUser(user)
            expect(accounts.length).toBe(2)
            await mapAsync(accounts, (account) => userAccountService.requirePlaidUpdate(account))

            const response = await supertest(app.getHttpServer())
                .get(`/api/account`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            await mapAsync(response.body, async (account: SerializedUserAccount) => {
                expect(account.linkTokens.length).toBe(2)
                const plaidTokens = await plaidLinkTokenService.findLinkTokensWhere({
                    userAccountId: account.id,
                    userId: account.userId
                })
                expect(plaidTokens.length).toBe(2)
                const tokens = [
                    plaidTokens.find((token) => token.tokenType === PlaidTokenType.ITEM_UPDATE),
                    plaidTokens.find((token) => token.tokenType === PlaidTokenType.ANDROID_ITEM_UPDATE)
                ]
                tokens.forEach((token) => {
                    expect(token).not.toBeNull()
                    expect(token.dateTimeTokenExpires.getTime()).toBeGreaterThanOrEqual(new Date().getTime())
                })
            })
        })
    })

    describe('GET /api/account/user/:userId', () => {
        it('Should retrieve a list of user accounts', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const accountToBeInactive = await userAccountService.findOneWhere({
                accountId: secondAccount.metaData.account.id
            })
            const repository = app.get<Repository<UserAccount>>(getRepositoryToken(UserAccount))
            accountToBeInactive.isActive = false
            repository.save(accountToBeInactive)

            const response = await supertest(app.getHttpServer())
                .get(`/api/account/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const accounts: UserAccount[] = response.body
            expect(accounts.length).toBe(2)
        })
        it('Should honor the active filter and only retrieve active accounts', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const accountToBeInactive = await userAccountService.findOneWhere({
                accountId: secondAccount.metaData.account.id
            })
            const repository = app.get<Repository<UserAccount>>(getRepositoryToken(UserAccount))
            accountToBeInactive.isActive = false
            await repository.save(accountToBeInactive)

            const response = await supertest(app.getHttpServer())
                .get(`/api/account/user/${user.id}?active=true`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const accounts: UserAccount[] = response.body
            expect(accounts.length).toBe(1)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when the user is not found`, async () => {
            const user = await seedService.seedUser(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH),
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName(),
                    role: Role.ADMIN
                })
            )
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const accountToBeInactive = await userAccountService.findOneWhere({
                accountId: secondAccount.metaData.account.id
            })
            const repository = app.get<Repository<UserAccount>>(getRepositoryToken(UserAccount))
            accountToBeInactive.isActive = false
            repository.save(accountToBeInactive)

            await supertest(app.getHttpServer())
                .get(`/api/account/user/9999999`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it('Should serialize the institution along with the account', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const response = await supertest(app.getHttpServer())
                .get(`/api/account/user/${user.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const accounts = response.body
            const account = accounts[0]
            expect(account.institution).toBeDefined()
            expect(account.institution.logoUrl).toBeDefined()
            expect(account.institution.primaryColorHexCode).toBeDefined()
        })
    })

    describe('PATCH /api/account/link-bank-account', () => {
        it('Should successfully create a UserAccount with data from plaid', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const dwollaService = app.get<DwollaIntegrationService>(DwollaIntegrationService)
            const createOrUpdateCustomerSpy = jest.spyOn(dwollaService, 'createOrUpdateCustomer')
            const createFundingSourceSpy = jest.spyOn(dwollaService, 'createFundingSource')

            return supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    const userAccount = await userAccountService.findOneWhere({ userId: user.id, isActive: true })

                    if (!userAccount) {
                        fail('User account was not created')
                    }

                    expect(userAccount.plaidPublicToken).toBe(mockDto.token)
                    expect(createOrUpdateCustomerSpy.mock.calls.length).toBe(1)
                    expect(createFundingSourceSpy.mock.calls.length).toBe(1)
                })
        })
        it("Should allow updates to a user's account when one already exists", async () => {
            const user = await seedService.seedUser()
            const userAccount = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const token = user.sessionToken
            const mockDto = createLinkBankAccountDto(userAccount.accountId)

            return supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    const account = await userAccountService.findOneWhere({ userId: maybeUser.id, isActive: true })

                    if (!account) {
                        fail('User account was not created')
                    }

                    expect(account.plaidPublicToken).toBe(mockDto.token)
                    expect(account.id).toBe(userAccount.id)
                })
        })
        it('Should reject updates to the plaid token with an invalid token', async () => {
            await seedService.seedUser()
            const token = authService.createBearerToken(
                new User({
                    email: faker.internet.email(),
                    password: faker.internet.password(MINIMUM_PASSWORD_LENGTH)
                })
            )
            const plaidToken = uuid()

            return supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    token: plaidToken
                })
                .expect(HttpStatus.FORBIDDEN)
        })
        it('Should create an unverified Dwolla customer when a bank account is linked with first & last name', async () => {
            DwollaServiceFake.GET_CUSTOMER_STATUS = 'unverified'
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)

            return supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)
                .then(async (_) => {
                    const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
                    if (!maybeUser) {
                        fail('Failed to find userProfile')
                    }

                    const userAccount = await userAccountService.findOneWhere({ userId: user.id, isActive: true })

                    if (!userAccount) {
                        fail('User account was not created')
                    }

                    expect(userAccount.dwollaFundingSourceId).not.toBeNull()
                    expect(maybeUser.dwollaCustomerStatus).toBe(DwollaCustomerStatus.UNVERIFIED)
                    expect(maybeUser.dwollaCustomerId).not.toBeNull()
                    expect(maybeUser.dwollaCustomerUrl).not.toBeNull()
                    expect(userAccount.dwollaFundingSourceId).not.toBeNull()
                })
        })
        it('Should allow the addition of multiple accounts', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            const secondAccount: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(secondAccount)
                .expect(HttpStatus.OK)

            const maybeUser = await userService.findOneWhere({ email: user.email.toLowerCase() })
            if (!maybeUser) {
                fail('Failed to find user')
            }

            const accounts = await userAccountService.findAllActive(maybeUser)

            if (accounts.length === 0) {
                fail('User account was not created')
            }

            expect(accounts.length).toBe(2)
            const expectedAccountIds = [PLAID_TEST_ACCOUNT_WITH_ACH_ID_2, PLAID_TEST_ACCOUNT_WITH_ACH_ID]
            const actualAccountIds = accounts.map((account) => account.accountId)
            actualAccountIds.forEach((token) => {
                expect(expectedAccountIds.includes(token)).toBeTruthy()
            })
            accounts.forEach((account) => {
                expect(account.isActive).toBeTruthy()
            })
        })
        it('Should not create a new access token when linking an account from a previously linked institution', async () => {
            const user = await seedService.seedUser()
            const account = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID, uuid())
            // The transaction pull should populate the db with appropriate accounts
            await seedService.seedHistoricalTransactionPull(user)
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)
            mockDto.metaData.institution.institutionId = account.institutionId
            mockDto.metaData.account.name = PLAID_TEST_ACCOUNT_WITH_ACH_NAME_2
            mockDto.metaData.account.mask = PLAID_TEST_ACCOUNT_WITH_ACH_MASK_2

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const accountOne = await userAccountService.findOneWhere({ accountId: PLAID_TEST_ACCOUNT_WITH_ACH_ID })
            const accountTwo = await userAccountService.findOneWhere({ accountId: PLAID_TEST_ACCOUNT_WITH_ACH_ID_2 })

            expect(accountOne.plaidAccessToken).toBe(accountTwo.plaidAccessToken)
            expect(accountOne.plaidItemId).toBe(accountTwo.plaidItemId)
        }, 20_000)
        it('Should create a new access token when link an account from a previously linked institution that has been unlinked', async () => {
            const user = await seedService.seedUser()
            const account = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID, uuid())
            // The transaction pull should populate the db with appropriate accounts
            await seedService.seedHistoricalTransactionPull(user)
            const token = user.sessionToken
            // The transaction pull should populate the db with appropriate accounts
            await seedService.seedHistoricalTransactionPull(user)
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)
            mockDto.metaData.institution.institutionId = account.institutionId
            mockDto.metaData.account.name = PLAID_TEST_ACCOUNT_WITH_ACH_NAME_2
            mockDto.metaData.account.mask = PLAID_TEST_ACCOUNT_WITH_ACH_MASK_2

            account.hasRemovedFundingSource = true
            await userAccountService.removeFundingSource(account)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const accountOne = await userAccountService.findOneWhere({ accountId: PLAID_TEST_ACCOUNT_WITH_ACH_ID })
            const accountTwo = await userAccountService.findOneWhere({ accountId: PLAID_TEST_ACCOUNT_WITH_ACH_ID_2 })

            expect(accountOne.plaidAccessToken).not.toBe(accountTwo.plaidAccessToken)
            expect(accountOne.plaidItemId).not.toBe(accountTwo.plaidItemId)
        })
        it('Should only respond with active accounts', async () => {
            const user = await seedService.seedUser()
            // Create an inactive account that should not show up in the output
            const account = await seedService.seedUserAccount(user, PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            account.isActive = false
            await userAccountService.save(account)
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)

            const response = await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            expect(response.body.userAccounts.length).toBe(1)
            expect(response.body.userAccounts[0].id).not.toBe(account.id)
        })
        it('Should store a plaid institution when one does not exist', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const institution = await userAccountService.findOneInstitutionWhere({
                institutionId: mockDto.metaData.institution.institutionId
            })
            expect(institution).not.toBeNull()
            expect(institution.logoSha256Hash).not.toBeNull()

            const bucket = configService.get(Environment.S3_PHOTOS_BUCKET)
            const key = institution.logoS3Key
            const s3Service = app.get<S3Service>(S3Service)
            const object = await s3Service.getObject({
                Bucket: bucket,
                Key: key
            })
            expect(object.ContentLength).toBeGreaterThan(0)
        })
        it('Should not store an additional plaid institution when one already exists', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            await seedService.seedPlaidInstitution(mockDto.metaData.institution.institutionId)

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const institutions = await userAccountService.findInstitutionWhere({})
            expect(institutions.length).toBe(1)
        })
        it('Should not try to register a customer with dwolla when linking a credit account (or any non-depository account)', async () => {
            const user = await seedService.seedUser()
            const token = user.sessionToken
            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID)
            mockDto.metaData.account.type = PlaidSupportedAccountType.CREDIT
            mockDto.metaData.account.subtype = 'credit card'
            const dwollaService = app.get<DwollaIntegrationService>(DwollaIntegrationService)
            const createOrUpdateCustomerSpy = jest.spyOn(dwollaService, 'createOrUpdateCustomer')
            const createFundingSourceSpy = jest.spyOn(dwollaService, 'createFundingSource')

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            expect(createOrUpdateCustomerSpy.mock.calls.length).toBe(0)
            expect(createFundingSourceSpy.mock.calls.length).toBe(0)
        })
    })

    describe('PATCH /api/account/:id/update-bank-account', () => {
        it("Should set the user record's requiresPlaidReAuthentication property to false", async () => {
            let context = TestingContext.fromApp(app)
            context = await context.chain(() => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID))
            const user = context.getUser()
            const account = context.getUserAccount()
            account.requiresPlaidReAuthentication = true
            await userAccountService.save(account)
            const token = user.sessionToken
            const dto = {
                accountId: account.id
            }

            await supertest(app.getHttpServer())
                .patch(`/api/account/${account.id}/update-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const updatedAccount = await userAccountService.findOneWhere({ id: account.id })
            expect(updatedAccount.requiresPlaidReAuthentication).toBeFalsy()
        })
    })

    describe('PATCH /api/account/:id/unlink-bank-account', () => {
        it(`Should not allow users to unlink bank accounts when there are active shared bills or recurring payments using the account`, async () => {
            let context = TestingContext.fromApp(app)
            await context.chain(
                context.withUser,
                () => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID),
                context.withPayee,
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE)
            )

            const user = context.getUser()
            const account = context.getUserAccount()
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .patch(`/api/account/${account.id}/unlink-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
        it(`Should allow the account to be re-linked at a later time`, async () => {
            let context = TestingContext.fromApp(app)
            await context.chain(
                context.withUser,
                () => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID),
                context.withPayee,
                context.withSharedBill
            )

            const user = context.getUser()
            const account = context.getUserAccount()
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .patch(`/api/account/${account.id}/unlink-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const updatedAccount = await userAccountService.findOneWhere({ id: account.id })
            expect(updatedAccount.hasRemovedFundingSource).toBe(true)

            const mockDto: LinkBankAccountDto = createLinkBankAccountDto(PLAID_TEST_ACCOUNT_WITH_ACH_ID_2)
            mockDto.metaData.account.type = PlaidSupportedAccountType.DEPOSITORY
            mockDto.metaData.account.subtype = 'debit card'
            mockDto.metaData.institution.institutionId = updatedAccount.institutionId
            const dwollaService = app.get<DwollaIntegrationService>(DwollaIntegrationService)
            const createOrUpdateCustomerSpy = jest.spyOn(dwollaService, 'createOrUpdateCustomer')
            const createFundingSourceSpy = jest.spyOn(dwollaService, 'createFundingSource')

            await supertest(app.getHttpServer())
                .patch(`/api/account/link-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockDto)
                .expect(HttpStatus.OK)

            const linkedAccount = await userAccountService.findOneWhere({ accountId: PLAID_TEST_ACCOUNT_WITH_ACH_ID_2 })
            expect(linkedAccount.hasRemovedFundingSource).toBe(false)
            expect(createOrUpdateCustomerSpy.mock.calls.length).toBe(1)
            expect(createFundingSourceSpy.mock.calls.length).toBe(1)
        })
        it('Should set all accounts from the institution as inactive and indicate that the funding source has been removed', async () => {
            let context = TestingContext.fromApp(app)
            await context.chain(
                context.withUser,
                () => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID),
                context.withPayee,
                context.withSharedBill
            )
            const user = context.getUser()
            const token = user.sessionToken
            const account = context.getUserAccount()

            await supertest(app.getHttpServer())
                .patch(`/api/account/${account.id}/unlink-bank-account`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const accounts = await userAccountService.findWhere({ institutionId: account.institutionId })
            expect(accounts.length).toBeGreaterThan(1)

            for (const unlinkedAccount of accounts) {
                expect(unlinkedAccount.hasRemovedFundingSource).toBeTruthy()
            }
        })
    })

    it(`Should delete any item update tokens from the ${PlaidLinkToken.name} table`, async () => {
        let context = TestingContext.fromApp(app)
        context = await context.chain(() => context.withLinkedBankAccount(PLAID_TEST_ACCOUNT_WITH_ACH_ID))
        const user = context.getUser()
        const account = context.getUserAccount()
        account.requiresPlaidReAuthentication = true
        await userAccountService.save(account)
        const token = user.sessionToken

        await supertest(app.getHttpServer())
            .get(`/api/account`)
            .set('Authorization', `Bearer ${token}`)
            .expect(HttpStatus.OK)

        const tokens = await plaidLinkTokenService.findLinkTokensWhere({ userId: user.id, userAccountId: account.id })
        expect(tokens.length).toBe(2)

        const dto = {
            accountId: account.id
        }

        await supertest(app.getHttpServer())
            .patch(`/api/account/${account.id}/update-bank-account`)
            .set('Authorization', `Bearer ${token}`)
            .send(dto)
            .expect(HttpStatus.OK)

        const updatedAccount = await userAccountService.findOneWhere({ id: account.id })
        expect(updatedAccount.requiresPlaidReAuthentication).toBeFalsy()
        const updateTokens = await plaidLinkTokenService.findLinkTokensWhere({
            userId: user.id,
            userAccountId: account.id
        })
        expect(updateTokens.length).toBe(0)
    })
})
