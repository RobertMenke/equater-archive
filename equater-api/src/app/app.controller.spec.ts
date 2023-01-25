import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as supertest from 'supertest'
import { ConfigService, Environment } from '../config/config.service'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'

describe('AppController', () => {
    let app: NestExpressApplication
    let configService: ConfigService

    beforeAll(async () => {
        app = await setup()
        configService = app.get<ConfigService>(ConfigService)
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

    it('Should respond successfully', async () => {
        const response = await supertest(app.getHttpServer()).get('/api/environment').send()
        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.plaidEnvironment).toBeDefined()
        expect(response.body.serverEnvironment).toBeDefined()
        expect(response.body.plaidEnvironment).toBe(configService.get(Environment.PLAID_ENVIRONMENT))
        expect(response.body.serverEnvironment).toBe(configService.get(Environment.SERVER_ENVIRONMENT))
    })
})
