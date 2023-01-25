import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SeedingService } from '../seeding/seeding.service'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { NewsletterRecipient } from './newsletter-recipient.entity'
import { NewsletterDto } from './newsletter.dto'
import { NewsletterService } from './newsletter.service'
import { faker } from '@faker-js/faker'
import * as supertest from 'supertest'

describe('Newsletter Controller', () => {
    let app: NestExpressApplication
    let seedingService: SeedingService
    let newsletterService: NewsletterService

    beforeAll(async () => {
        app = await setup()
        seedingService = app.get<SeedingService>(SeedingService)
        newsletterService = app.get<NewsletterService>(NewsletterService)
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

    it('Should create a newsletter entry when supplied with a valid email', async () => {
        const dto: NewsletterDto = {
            email: faker.internet.email()
        }

        await supertest(app.getHttpServer()).put('/api/newsletter/email').send(dto).expect(HttpStatus.OK)

        const recipient = await newsletterService.findOne({ email: dto.email })
        expect(recipient).toBeInstanceOf(NewsletterRecipient)
    })
    it('Should respond with 400 when an invalid email is supplied', () => {
        const dto: NewsletterDto = {
            email: faker.name.firstName()
        }

        return supertest(app.getHttpServer()).put('/api/newsletter/email').send(dto).expect(HttpStatus.BAD_REQUEST)
    })
    it('Should respond successfully when a duplicate email is added to the newsletter', async () => {
        const dto: NewsletterDto = {
            email: faker.internet.email()
        }

        await newsletterService.addRecipient(dto.email)

        await supertest(app.getHttpServer()).put('/api/newsletter/email').send(dto).expect(HttpStatus.OK)

        const recipient = await newsletterService.findOne({ email: dto.email })
        expect(recipient).toBeInstanceOf(NewsletterRecipient)
    })
})
