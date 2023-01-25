import { HttpStatus } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getRepositoryToken } from '@nestjs/typeorm'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { VendorAssociationEvent } from '../expense_api/events/vendor-association.event'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { AuthService } from '../user/auth.service'
import { Role } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { asyncAfter, BinaryStatus } from '../utils/data.utils'
import { LogoFetchServiceFake } from './logo-fetch.service.fake'
import { TransactionService } from './transaction.service'
import { UniqueVendorAssociation, UniqueVendorAssociationType } from './unique-vendor-association.entity'
import { UniqueVendor } from './unique-vendor.entity'
import { AssociateVendorDto, CreateVendorFromPlaceDto, PatchVendorDto } from './vendor.dto'
import { VendorService } from './vendor.service'
import * as sharp from 'sharp'

describe('Vendor Controller', () => {
    let app: NestExpressApplication
    let seedService: SeedingService
    let context: TestingContext
    let transactionService: TransactionService
    let vendorService: VendorService
    let authService: AuthService
    let configService: ConfigService
    let userService: UserService
    let sharedExpenseService: SharedExpenseService

    beforeAll(async () => {
        app = await setup()
        seedService = app.get<SeedingService>(SeedingService)
        transactionService = app.get<TransactionService>(TransactionService)
        vendorService = app.get<VendorService>(VendorService)
        authService = app.get<AuthService>(AuthService)
        configService = app.get<ConfigService>(ConfigService)
        userService = app.get<UserService>(UserService)
        sharedExpenseService = app.get<SharedExpenseService>(SharedExpenseService)
    })

    beforeEach(async () => {
        await resetTestingState(app)
        context = TestingContext.fromApp(app)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    describe('GET /api/vendor', () => {
        it('Should retrieve up to 100 vendors sorted alphabetically', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(105, true))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(100)
                })
        })
        it('Should respond with a valid next link when a next page exists', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(105, true))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.previousPage).toBeNull()
                    expect(response.body.nextPage.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with a valid previous link when a previous page exists', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(105))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor?page=1`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.nextPage).toBeNull()
                    expect(response.body.previousPage.length).toBeGreaterThan(0)
                })
        })
    })

    describe('PUT /api/vendor', () => {
        it(`Should add a new vendor and respond with a serialized ${UniqueVendor.name}`, async () => {
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendorName = faker.company.name()
            const vendorUuid = uuid()

            const response = await supertest(app.getHttpServer())
                .put(`/api/vendor`)
                .send({
                    friendlyName: vendorName,
                    uuid: vendorUuid
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const vendor = await vendorService.findUniqueVendorBy({ id: response.body.id })
            expect(vendor.friendlyName).toBe(vendorName)
            expect(vendor.uuid).toBe(vendorUuid)
            expect(vendor.hasBeenReviewedInternally).toBeTruthy()
        })
        it(`Should respond with a ${HttpStatus.CONFLICT} if there's an existing vendor`, async () => {
            await context.chain(context.withUser, context.withUniqueVendor)
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendorName = vendor.friendlyName
            const vendorUuid = uuid()

            await supertest(app.getHttpServer())
                .put(`/api/vendor`)
                .send({
                    friendlyName: vendorName,
                    uuid: vendorUuid
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.CONFLICT)
        })
    })

    describe('PUT /api/vendor/from-google-places', () => {
        function createPlace(): CreateVendorFromPlaceDto {
            const placeName = faker.company.name()
            const placeAddress = faker.address.streetAddress(true)
            const placeId = uuid()

            return {
                placeId: placeId,
                fullText: `${placeName} ${placeAddress}`,
                primaryText: placeName,
                secondaryText: placeAddress
            }
        }

        it('It should respond with an existing vendor if the vendor already exists', async () => {
            const place = createPlace()
            await context.withUser()
            await context.withUniqueVendor(place.primaryText, true)
            const existingVendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .put(`/api/vendor/from-google-places`)
                .send(place)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.id).toBe(existingVendor.id)
        })
        it('It should save a merchant from google places with a place ID. It should not attempt to save a logo URL. It should not be marked as reviewed internally.', async () => {
            const place = createPlace()
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .put(`/api/vendor/from-google-places`)
                .send(place)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const vendor: UniqueVendor = response.body
            const vendorInDb = await vendorService.findUniqueVendorBy({ id: vendor.id })
            expect(vendorInDb).not.toBeNull()
            expect(vendorInDb.googlePlacesId).toBe(place.placeId)
            expect(vendorInDb.hasBeenReviewedInternally).toBeFalsy()
        })
    })

    describe('GET /api/vendor/popular', () => {
        it('Should respect the limit query parameter', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(50, true))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor/popular?limit=30`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(30)
                })
        })
        it('Should sort from most popular to least popular', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(50))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor/popular?limit=10`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    const vendors = response.body.vendors
                    expect(vendors).toBeInstanceOf(Array)
                    vendors.forEach((vendor, index) => {
                        if (index > 0) {
                            expect(vendor.totalNumberOfExpenseSharingAgreements).toBeLessThanOrEqual(
                                vendors[index - 1].totalNumberOfExpenseSharingAgreements
                            )
                        }
                    })
                })
        })
        it('Should exclude vendors that require internal review', async () => {
            context = await context.chain(context.withUser, () => context.withUniqueVendors(20, false))
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor/popular?limit=30`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(0)
                })
        })
    })

    describe('GET /api/vendor/requires-internal-review', () => {
        it('Should only retrieve vendors that require internal review', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor, () =>
                context.withUniqueVendor(faker.company.name(), true)
            )
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor/requires-internal-review`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(1)
                })
        })
    })

    describe('GET /api/vendor/search', () => {
        it('Should match vendors on friendly name', async () => {
            context = await context.chain(
                context.withUser,
                () => context.withUniqueVendor(faker.company.name(), true),
                () => context.withUniqueVendor(faker.company.name(), true)
            )
            const user = context.getUser()
            const token = user.sessionToken
            const vendor = context.getUniqueVendors()[0]

            return supertest(app.getHttpServer())
                .get(`/api/vendor/search?searchTerm=${vendor.friendlyName}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(1)
                })
        })
        it('Should match vendors on transaction name', async () => {
            context = await context.chain(
                context.withUser,
                () => context.withUniqueVendor(faker.company.name(), true),
                () => context.withUniqueVendor(faker.company.name(), true)
            )
            const user = context.getUser()
            const token = user.sessionToken
            const vendor = context.getUniqueVendors()[0]

            return supertest(app.getHttpServer())
                .get(`/api/vendor/search?searchTerm=${vendor.friendlyName}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(1)
                })
        })
        it('Should not include vendors that have been flagged as unable to be identified', async () => {
            context = await context.chain(context.withUser, () =>
                context.withUniqueVendor(faker.company.name(), true, true)
            )
            const user = context.getUser()
            const token = user.sessionToken
            const vendor = context.getUniqueVendors()[0]

            return supertest(app.getHttpServer())
                .get(`/api/vendor/search?searchTerm=${vendor.friendlyName}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(0)
                })
        })
        it('Should limit the search to vendors requiring internal review when specified', async () => {
            const name = faker.company.name()
            context = await context.chain(
                context.withUser,
                () => context.withUniqueVendor(name, false),
                () => context.withUniqueVendor(`${name}_unique`, true)
            )
            const user = context.getUser()
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .get(`/api/vendor/search?searchTerm=${name}&requiringInternalReview=true`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendors).toBeInstanceOf(Array)
                    expect(response.body.vendors.length).toBe(1)
                })
        })
    })

    describe('GET /api/vendor/logo-lookup', () => {
        it(`Should respond with ${HttpStatus.BAD_REQUEST} when a vendor name is not supplied`, async () => {
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/vendor/logo-lookup?vendorName=`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.BAD_REQUEST)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when a logo couldn't be found`, async () => {
            LogoFetchServiceFake.SHOULD_FAIL = true
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/vendor/logo-lookup?vendorName=abcd`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it(`Should respond with a pre-signed url when a logo is found`, async () => {
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/vendor/logo-lookup?vendorName=Spotify`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.uuid).toBeDefined()
            expect(response.body.preSignedUrl).toBeDefined()
            expect(response.body.key).toBeDefined()
            expect(response.body.bucket).toBeDefined()
            expect(response.body.uuid.length).toBeGreaterThan(0)
            expect(response.body.preSignedUrl.length).toBeGreaterThan(0)
            expect(response.body.key.length).toBeGreaterThan(0)
            expect(response.body.bucket.length).toBeGreaterThan(0)
        })
        it(`Should respond with ${HttpStatus.CONFLICT} when a merchant with the same name exists`, async () => {
            const existingVendorName = 'Spotify'
            context = await context.chain(context.withUser, () => context.withUniqueVendor(existingVendorName))
            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/vendor/logo-lookup?vendorName=${existingVendorName}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.CONFLICT)
        })
    })

    describe('GET /api/vendor/:id', () => {
        it('Should retrieve a vendor by id when one exists', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = context.getUser()
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()

            return supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.vendor).toBeDefined()
                })
        })
        it('Should respond with 404 when a vendor matching the supplied id does not exist', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = context.getUser()
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()

            return supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id + 1}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /api/vendor/:id/associations', () => {
        it('Should fetch associations when they exist', async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))
            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )
            const vendorThree = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendor.id,
                    associatedUniqueVendorId: vendorTwo.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendor.id,
                    associatedUniqueVendorId: vendorThree.id,
                    associationType: UniqueVendorAssociationType.PARENT_COMPANY
                })
            )

            const response = await supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id}/associations`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.length).toBe(2)
        })
        it('Should return an empty list when no associations exist', async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id}/associations`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body.length).toBe(0)
        })
        it(`Should return ${HttpStatus.NOT_FOUND} when the vendor does not exist`, async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .get(`/api/vendor/${9999}/associations`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /api/vendor/:id/associations/:associationId', () => {
        it('Should delete a vendor association successfully', async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))
            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const association = await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendor.id,
                    associatedUniqueVendorId: vendorTwo.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            const associations = await repository.find()
            expect(associations.length).toBe(1)

            await supertest(app.getHttpServer())
                .delete(`/api/vendor/${vendor.id}/associations/${association.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const associationsAfterDelete = await repository.find()
            expect(associationsAfterDelete.length).toBe(0)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when the vendor doesn't exist`, async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))
            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const association = await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendor.id,
                    associatedUniqueVendorId: vendorTwo.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            const associations = await repository.find()
            expect(associations.length).toBe(1)

            await supertest(app.getHttpServer())
                .delete(`/api/vendor/${9999}/associations/${association.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
        it(`Should respond with ${HttpStatus.NOT_FOUND} when the association doesn't exist`, async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const vendor = context.getUniqueVendors()[0]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))
            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendor.id,
                    associatedUniqueVendorId: vendorTwo.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            const associations = await repository.find()
            expect(associations.length).toBe(1)

            await supertest(app.getHttpServer())
                .delete(`/api/vendor/${vendor.id}/associations/${9999}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    async function createPatchVendorDto(vendor: UniqueVendor, withLogoUpload: boolean): Promise<PatchVendorDto> {
        if (withLogoUpload) {
            await seedService.uploadPreProcessedVendorLogo(vendor)
        }

        return {
            friendlyName: faker.company.name(),
            preProcessedLogoWasUploaded: withLogoUpload,
            ppdId: uuid(),
            vendorIdentityCannotBeDetermined: false
        }
    }

    describe('PATCH /api/vendor/:id', () => {
        it('Should update a vendor when supplied with a valid DTO', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()
            const dto = await createPatchVendorDto(vendor, faker.datatype.boolean())

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.vendor).toBeDefined()
                    const updatedVendor = await vendorService.findUniqueVendorBy({ id: vendor.id })
                    expect(updatedVendor.friendlyName).toBe(dto.friendlyName)
                    if (dto.preProcessedLogoWasUploaded) {
                        expect(updatedVendor.logoS3Bucket).toBe(configService.get(Environment.VENDOR_ASSETS_S3_BUCKET))
                        expect(updatedVendor.logoS3Key).toBe(updatedVendor.uuid)
                        expect(updatedVendor.logoSha256Hash).not.toBeNull()
                    }
                    expect(updatedVendor.ppdId).toBe(dto.ppdId)
                })
        }, 30_000)
        it('Should respond with 400 when a valid DTO is not supplied', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()
            const dto = await createPatchVendorDto(vendor, false)
            delete dto.preProcessedLogoWasUploaded

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.BAD_REQUEST)
        })
        it('Should allow updates to vendorIdentityCannotBeDetermined when no valid PPD ID is supplied', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()
            const dto = await createPatchVendorDto(vendor, false)
            dto.ppdId = null
            dto.vendorIdentityCannotBeDetermined = true

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async (response) => {
                    expect(response.body.vendor).toBeDefined()
                    const updatedVendor = await vendorService.findUniqueVendorBy({ id: vendor.id })
                    expect(updatedVendor.vendorIdentityCannotBeDetermined).toBeTruthy()
                })
        })
        it('Should create a processed version of the vendor logo when uploaded', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()
            const dto = await createPatchVendorDto(vendor, true)

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const bucket = configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
                    const key = `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
                    const s3Service = app.get<S3Service>(S3Service)
                    const object = await s3Service.getObject({
                        Bucket: bucket,
                        Key: key
                    })
                    const metaData = await sharp(object.Body as Buffer).metadata()
                    expect(metaData.height).toBeLessThanOrEqual(VendorService.LOGO_HEIGHT)
                    expect(metaData.width).toBeLessThanOrEqual(VendorService.LOGO_WIDTH)
                })
        })
        it('Should delete the pre-processed copy of the vendor logo when uploaded', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()
            const dto = await createPatchVendorDto(vendor, true)

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const bucket = configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
                    const key = `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
                    const s3Service = app.get<S3Service>(S3Service)
                    try {
                        await s3Service.getObject({
                            Bucket: bucket,
                            Key: key
                        })
                        fail('Pre-processed vendor logo still exists')
                    } catch (e) {
                        expect(e.message).toBe('The specified key does not exist.')
                    }
                })
        })
    })

    describe('PATCH /api/vendor/:id/assign-to-existing-vendor/:existingVendorId', () => {
        it('Should associate vendor names associated with the vendor under review with the existing vendor', async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const underReview = context.getUniqueVendors()[0]
            const existingVendor = context.getUniqueVendors()[1]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${underReview.id}/assign-to-existing-vendor/${existingVendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const vendorNames = await vendorService.findVendorTransactionNamesBy({
                        uniqueVendorId: existingVendor.id
                    })
                    expect(vendorNames.length).toBe(2)
                })
        })
        it('Should delete the vendor under review once its records have been associated with an existing vendor', async () => {
            await context.chain(context.withUser, () => context.withUniqueVendors(2, true))
            const underReview = context.getUniqueVendors()[0]
            const existingVendor = context.getUniqueVendors()[1]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${underReview.id}/assign-to-existing-vendor/${existingVendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const vendorUnderReview = await vendorService.findUniqueVendorBy({ id: underReview.id })
                    expect(vendorUnderReview).toBeNull()
                    const associatedVendor = await vendorService.findUniqueVendorBy({ id: existingVendor.id })
                    expect(associatedVendor).toBeInstanceOf(UniqueVendor)
                })
        })
        it('Should associate any transactions associated with the vendor under review with the supplied, correct vendor', async () => {
            await context.withTransactionHistory()
            const vendors = await vendorService.getUniqueVendors()
            const underReview = vendors[0]
            const existingVendor = vendors[1]
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const transactionWithVendorUnderReview = await transactionService.findManyTransactionsBy({
                uniqueVendorId: underReview.id
            })
            const transactionWithExistingVendor = await transactionService.findManyTransactionsBy({
                uniqueVendorId: existingVendor.id
            })

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${underReview.id}/assign-to-existing-vendor/${existingVendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    const underReviewVendorTransactions = await transactionService.findManyTransactionsBy({
                        uniqueVendorId: underReview.id
                    })
                    const existingVendorTransactions = await transactionService.findManyTransactionsBy({
                        uniqueVendorId: existingVendor.id
                    })
                    expect(underReviewVendorTransactions.length).toBe(0)
                    expect(existingVendorTransactions.length).toBe(
                        transactionWithExistingVendor.length + transactionWithVendorUnderReview.length
                    )
                })
        })
        it('Should process shared expense agreements that were set up for the vendor the transaction is now assigned to', async () => {
            await context.withTransactionHistory()
            const vendors = await vendorService.getUniqueVendors()
            const underReview = vendors.find((vendor) => vendor.friendlyName === 'Starbucks')
            const existingVendor = vendors.find((vendor) => vendor.friendlyName === "McDonald's")
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await context.chain(
                () => context.withPayees(2),
                () => context.withSharedBill(BinaryStatus.IS_ACTIVE, existingVendor),
                () => context.withSharedExpenseUserAgreements(BinaryStatus.IS_ACTIVE)
            )

            return supertest(app.getHttpServer())
                .patch(`/api/vendor/${underReview.id}/assign-to-existing-vendor/${existingVendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then(async () => {
                    await asyncAfter(10000, async () => {
                        const sharedExpenseTransaction = await sharedExpenseService.findTransactionBy({
                            sourceAccountId: context.getSecondaryUserAccounts().pop().id,
                            destinationAccountId: context.getUserAccount().id
                        })
                        expect(sharedExpenseTransaction).not.toBeNull()
                        expect(sharedExpenseTransaction.plaidTransactionId).not.toBeNull()
                        const transaction = await sharedExpenseTransaction.plaidTransaction
                        expect(transaction.uniqueVendorId).toBe(existingVendor.id)
                    })
                })
        }, 15000)
    })

    describe('PUT /api/vendor/:vendorId/associate-with/:associatedVendorId', () => {
        const associateVendorDto: AssociateVendorDto = {
            associationType: UniqueVendorAssociationType.PARENT_COMPANY,
            notes: faker.lorem.sentence()
        }

        it('Should associate 2 existing unique vendors', async () => {
            const vendorOne = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .put(`/api/vendor/${vendorOne.id}/associate-with/${vendorTwo.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(associateVendorDto)
                .expect(HttpStatus.OK)

            expect(response.status).toBe(HttpStatus.OK)
            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))
            const associations = await repository.find()
            expect(associations.length).toBe(1)
            const association = associations[0]
            expect(association.associationType).toBe(associateVendorDto.associationType)
            expect(association.notes).toBe(associateVendorDto.notes)
        })
        it(`Should publish a ${VendorAssociationEvent.name} event when a new association is made`, async () => {
            const vendorOne = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const eventBus = app.get<EventBus>(EventBus)
            const spy = jest.spyOn(eventBus, 'publish')

            await supertest(app.getHttpServer())
                .put(`/api/vendor/${vendorOne.id}/associate-with/${vendorTwo.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(associateVendorDto)
                .expect(HttpStatus.OK)

            expect(spy.mock.calls.length).toBe(1)
        })
        it('Should throw a not found exception if either of the vendors are unknown', async () => {
            const vendorOne = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .put(`/api/vendor/${vendorOne.id}/associate-with/999999`)
                .set('Authorization', `Bearer ${token}`)
                .send(associateVendorDto)
                .expect(HttpStatus.NOT_FOUND)
        })
        it('Should use an existing association if there is one', async () => {
            const vendorOne = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))

            await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendorTwo.id,
                    associatedUniqueVendorId: vendorOne.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            await supertest(app.getHttpServer())
                .put(`/api/vendor/${vendorOne.id}/associate-with/${vendorTwo.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(associateVendorDto)
                .expect(HttpStatus.OK)

            const associations = await repository.find()
            expect(associations.length).toBe(1)
        })
        it('Should update the existing vendor if new data is passed', async () => {
            const vendorOne = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const vendorTwo = await seedService.seedVendor(
                new UniqueVendor({
                    friendlyName: faker.company.name()
                })
            )

            const repository = app.get<Repository<UniqueVendorAssociation>>(getRepositoryToken(UniqueVendorAssociation))

            await repository.save(
                new UniqueVendorAssociation({
                    uniqueVendorId: vendorTwo.id,
                    associatedUniqueVendorId: vendorOne.id,
                    associationType: UniqueVendorAssociationType.OTHER
                })
            )

            await context.withUser()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const notes = faker.lorem.sentence()
            const associationType = UniqueVendorAssociationType.SUBSIDIARY_COMPANY
            const dto = { ...associateVendorDto, notes, associationType }

            await supertest(app.getHttpServer())
                .put(`/api/vendor/${vendorOne.id}/associate-with/${vendorTwo.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dto)
                .expect(HttpStatus.OK)

            const associations = await repository.find()
            expect(associations.length).toBe(1)
            const association = associations[0]
            expect(association.notes).toBe(dto.notes)
            expect(association.associationType).toBe(dto.associationType)
        })
    })

    describe('GET /api/vendor/:id/logo-upload-url', () => {
        it('Should respond with a valid pre-signed upload url when supplied a valid id', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()

            return supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id}/logo-upload-url`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .then((response) => {
                    expect(response.body.preSignedUploadUrl).toBeDefined()
                    expect(response.body.preSignedUploadUrl.length).toBeGreaterThan(0)
                })
        })
        it('Should respond with 404 when a vendor matching the supplied id does not exist', async () => {
            context = await context.chain(context.withUser, context.withUniqueVendor)
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken
            const vendor = context.getUniqueVendors().pop()

            return supertest(app.getHttpServer())
                .get(`/api/vendor/${vendor.id + 1}/logo-upload-url`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })
})
