import { NestExpressApplication } from '@nestjs/platform-express'
import { finishDatabaseTestingTransaction, resetTestingState, setup, teardown } from '../setup.test'
import { PlaidService } from '../plaid/plaid.service'
import { PlaidCategoryService } from './plaid-category.service'

describe('User Controller', () => {
    let app: NestExpressApplication
    let categoryService: PlaidCategoryService
    let plaidService: PlaidService

    beforeAll(async () => {
        app = await setup()
        categoryService = app.get<PlaidCategoryService>(PlaidCategoryService)
        plaidService = app.get<PlaidService>(PlaidService)
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

    it('should import plaid categories successfully', async () => {
        try {
            let response = await plaidService.getCategories()
            response.categories = response.categories.slice(0, 10)
            await categoryService.syncCategories(response)
            expect(response.categories.length).toBeGreaterThan(0)
        } catch (err) {
            fail(err.message)
        }
    })
})
