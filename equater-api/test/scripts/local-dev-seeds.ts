import { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app/app.module'
import { ConfigService } from '../../src/config/config.service'
import { createRedisAdapter } from '../../src/config/redis.factory'
import { DwollaService } from '../../src/dwolla/dwolla.service'
import { DwollaServiceFake } from '../../src/dwolla/dwolla.service.fake'
import { EmailService } from '../../src/email/email.service'
import { EmailServiceFake } from '../../src/email/email.service.fake'
import { FakeInterceptor } from '../../src/interceptors/fake.interceptor'
import { UserSearchCacheInterceptor } from '../../src/interceptors/user-search-cache.interceptor'
import { PlaidService } from '../../src/plaid/plaid.service'
import { PlaidServiceFake } from '../../src/plaid/plaid.service.fake'
import { SeedingModule } from '../../src/seeding/seeding.module'
import { SeedingService } from '../../src/seeding/seeding.service'
import { TestingContext } from '../../src/seeding/testing-context'
import { RedisIoAdapter } from '../../src/socket/redis-io.adapter'
import { repeatAsync } from '../../src/utils/data.utils'

// Usage: ./seed.sh -u 5
async function setup(): Promise<NestExpressApplication> {
    const appBuilder = Test.createTestingModule({
        imports: [AppModule, SeedingModule]
    })
        .overrideProvider(EmailService)
        .useClass(EmailServiceFake)
        .overrideProvider(PlaidService)
        .useClass(PlaidServiceFake)
        .overrideProvider(DwollaService)
        .useClass(DwollaServiceFake)
        .overrideInterceptor(UserSearchCacheInterceptor)
        .useClass(FakeInterceptor)

    const testingModule = await appBuilder.compile()
    const app = testingModule.createNestApplication<NestExpressApplication>()
    const configService = app.get<ConfigService>(ConfigService)
    app.useWebSocketAdapter(new RedisIoAdapter(app, await createRedisAdapter(configService)))
    await app.init()

    return app
}

async function seedUsers(app: NestExpressApplication, numberOfUsers: number = 100) {
    const seedService = app.get<SeedingService>(SeedingService)
    await repeatAsync(numberOfUsers, async () => {
        let context = TestingContext.fromApp(app)
        context = await context.chain(context.withUserHavingProfilePhoto, context.withLinkedBankAccount)
        console.log(`Created user ${context.getUser().firstName} ${context.getUser().lastName}`)
    })
}

const args = process.argv.slice(2)
console.log(args)

let numberOfUsers: number = 0
args.forEach((arg, index) => {
    if (arg === '-u' && args[index + 1]) {
        numberOfUsers = parseInt(args[index + 1], 10)
    }
})

if (!isNaN(numberOfUsers)) {
    setup()
        .then((app) => seedUsers(app, numberOfUsers))
        .then(() => console.log('done!'))
        .then(() => process.exit(0))
        .catch(console.error)
}
