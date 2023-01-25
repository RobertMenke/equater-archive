import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as supertest from 'supertest'
import { AuthService } from '../user/auth.service'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { Role } from '../user/user.entity'
import { UserService } from '../user/user.service'

describe('TransactionController', () => {
    let app: NestExpressApplication
    let seedingService: SeedingService
    let context: TestingContext
    let userService: UserService
    let authService: AuthService

    beforeAll(async () => {
        app = await setup()
        seedingService = app.get<SeedingService>(SeedingService)
        userService = app.get<UserService>(UserService)
        authService = app.get<AuthService>(AuthService)
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

    describe('GET /api/transaction/vendor/:id', () => {
        it('Should retrieve all transactions for a given vendor', async () => {
            await context.withTransactionHistory()
            const vendor = context.getUniqueVendor()
            const user = await userService.setRole(context.getUser(), Role.ADMIN)
            const token = user.sessionToken

            const response = await supertest(app.getHttpServer())
                .get(`/api/transaction/vendor/${vendor.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeInstanceOf(Array)
            expect(response.body.length).toBeGreaterThan(0)
        })
    })
})
