import { NestExpressApplication } from '@nestjs/platform-express'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { ConfigService, Environment } from '../config/config.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { S3Service } from './s3.service'
import { v4 as uuid } from 'uuid'

describe('S3Service Unit Test', () => {
    let app: NestExpressApplication
    let service: S3Service
    let seedingService: SeedingService
    let context: TestingContext
    let configService: ConfigService

    beforeAll(async () => {
        app = await setup()
        service = app.get<S3Service>(S3Service)
        seedingService = app.get<SeedingService>(SeedingService)
        configService = app.get<ConfigService>(ConfigService)
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

    it('Should create a presigned upload url given a valid user', async () => {
        const link = await service.createPreSignedUploadUrl({
            Bucket: configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: uuid()
        })

        expect(link).toBeDefined()
        expect(link.length).toBeGreaterThan(0)
    })
})
