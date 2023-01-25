import { NestExpressApplication } from '@nestjs/platform-express'
import { In } from 'typeorm'
import { finishDatabaseTestingTransaction, setup, teardown } from '../setup.test'
import { SeedingService } from '../seeding/seeding.service'
import { TestingContext } from '../seeding/testing-context'
import { PushNotificationService, PushNotificationTag } from './push-notification.service'
import { faker } from '@faker-js/faker'

describe(PushNotificationService.name, () => {
    let app: NestExpressApplication
    let context: TestingContext
    let seedingService: SeedingService
    let pushService: PushNotificationService

    beforeAll(async () => {
        app = await setup()
    })

    beforeEach(async () => {
        seedingService = app.get<SeedingService>(SeedingService)
        context = TestingContext.fromApp(app)
        pushService = app.get<PushNotificationService>(PushNotificationService)
    })

    afterEach(async () => {
        await finishDatabaseTestingTransaction()
    })

    afterAll(async () => {
        await teardown(app)
    })

    it('Should store records of push notifications when they go out as single notifications', async () => {
        await context.withUserDevice()

        await pushService.sendNotification(context.getUserDevices()[0], PushNotificationTag.NOTIFICATION, {
            title: faker.lorem.word(),
            body: faker.lorem.words(2)
        })

        const notifications = await pushService.findWhere({ deviceId: context.getUserDevices()[0].id })
        expect(notifications.length).toBe(1)
    })

    it('Should store records of push notifications when they go out in batches', async () => {
        await context.chain(context.withUserDevice, context.withUserDevice)

        await pushService.sendNotificationToDevices(context.getUserDevices(), PushNotificationTag.NOTIFICATION, {
            title: faker.lorem.word(),
            body: faker.lorem.words(2)
        })

        const notifications = await pushService.findWhere({
            deviceId: In(context.getUserDevices().map((device) => device.id))
        })
        expect(notifications.length).toBe(2)
    })
})
