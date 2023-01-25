import { HttpStatus } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import { addDays } from 'date-fns'
import * as firebase from 'firebase-admin'
import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { PoorMansPagerDutyService } from './alerting/poor-mans-pager-duty.service'
import { PoorMansPagerDutyServiceFake } from './alerting/poor-mans-pager-duty.service.fake'
import { AppModule } from './app/app.module'
import { ConfigService, Environment, Provider } from './config/config.service'
import { DatabaseConfigurationService } from './config/database-configuration.service'
import { DatabaseConfigurationServiceFake } from './config/database-configuration.service.fake'
import { PushNotificationService } from './device/push-notification.service'
import { PushNotificationServiceFake } from './device/push-notification.service.fake'
import { DwollaService } from './dwolla/dwolla.service'
import { DwollaServiceFake } from './dwolla/dwolla.service.fake'
import { DwollaTransferStatus } from './dwolla/dwolla.types'
import { EmailService } from './email/email.service'
import { EmailServiceFake } from './email/email.service.fake'
import { RecurrentPaymentProcessor } from './expense_api/recurrent-payment.processor'
import { DwollaWebhookGuard } from './guards/auth/dwolla-webhook.guard'
import { EnvironmentGuard } from './guards/dev/environment.guard'
import { FakeGuard } from './guards/fake.guard'
import { FakeInterceptor } from './interceptors/fake.interceptor'
import { UserSearchCacheInterceptor } from './interceptors/user-search-cache.interceptor'
import { VendorSearchCacheInterceptor } from './interceptors/vendor-search-cache.interceptor'
import { PlaidService } from './plaid/plaid.service'
import { PlaidServiceFake } from './plaid/plaid.service.fake'
import { SeedingModule } from './seeding/seeding.module'
import { CommunicationGateway } from './socket/communication.gateway'
import { CommunicationGatewayFake } from './socket/communication.gateway.fake'
import { LogoFetchService } from './transaction/logo-fetch.service'
import { LogoFetchServiceFake } from './transaction/logo-fetch.service.fake'
import { randomBetween } from './utils/data.utils'
import { TransactionalTestContext } from 'typeorm-transactional-tests'

export async function setup(): Promise<NestExpressApplication> {
    const appBuilder = await makeAppBuilder()
    const testingModule = await appBuilder.compile()
    const app = testingModule.createNestApplication<NestExpressApplication>()
    await app.init()
    const connection = app.get<DataSource>(DataSource)
    await connection.synchronize(true)

    return app
}

export function makeAppBuilder(): TestingModuleBuilder {
    return Test.createTestingModule({
        imports: [AppModule, SeedingModule]
    })
        .overrideProvider(DatabaseConfigurationService)
        .useClass(DatabaseConfigurationServiceFake)
        .overrideProvider(EmailService)
        .useClass(EmailServiceFake)
        .overrideProvider(PlaidService)
        .useClass(PlaidServiceFake)
        .overrideProvider(DwollaService)
        .useClass(DwollaServiceFake)
        .overrideProvider(ConfigService)
        .useValue(createConfig())
        .overrideProvider(LogoFetchService)
        .useClass(LogoFetchServiceFake)
        .overrideProvider(CommunicationGateway)
        .useClass(CommunicationGatewayFake)
        .overrideProvider(PoorMansPagerDutyService)
        .useClass(PoorMansPagerDutyServiceFake)
        .overrideProvider(PushNotificationService)
        .useClass(PushNotificationServiceFake)
        .overrideInterceptor(UserSearchCacheInterceptor)
        .useClass(FakeInterceptor)
        .overrideInterceptor(VendorSearchCacheInterceptor)
        .useClass(FakeInterceptor)
        .overrideGuard(EnvironmentGuard)
        .useClass(FakeGuard)
        .overrideGuard(DwollaWebhookGuard)
        .useClass(FakeGuard)
}

export async function resetTestingState(app: NestExpressApplication) {
    await setupDatabaseTestingTransaction(app)
    resetTestingDefaults()
    setupSpies(app)
}

let transactionContext: TransactionalTestContext
let isDebug = false

export async function setupDatabaseTestingTransaction(app: NestExpressApplication) {
    const connection = app.get<DataSource>(DataSource)

    if (isDebug) {
        await connection.synchronize(true)
        return
    }

    transactionContext = new TransactionalTestContext(connection)
    await transactionContext.start()
}

export async function finishDatabaseTestingTransaction() {
    // Note: despite the name the default behavior here doesn't actually reset all mocks :/ https://github.com/facebook/jest/issues/7136#issuecomment-590510531
    jest.resetAllMocks()

    if (!isDebug && transactionContext) {
        await transactionContext.finish()
    }
}

export function resetTestingDefaults() {
    PlaidServiceFake.availableBalance = randomBetween(10000, 1000000)
    DwollaServiceFake.CREATE_TRANSFER_RESPONSE = HttpStatus.CREATED
    DwollaServiceFake.GET_CUSTOMER_STATUS = 'verified'
    DwollaServiceFake.TRANSFER_STATUS = DwollaTransferStatus.PENDING
    RecurrentPaymentProcessor.SHOULD_HANDLE_JOBS = true
    DwollaServiceFake.FIND_PENDING_TRANSFERS = false
    PlaidServiceFake.ACCOUNT_ID = null
    PlaidServiceFake.shouldThrowAuthError = false
    PlaidServiceFake.linkTokenExpiration = addDays(new Date(), 1)
    LogoFetchServiceFake.SHOULD_FAIL = false
}

export async function teardown(app: NestExpressApplication) {
    jest.restoreAllMocks()
    const connection = app.get<DataSource>(DataSource)
    await connection.dropDatabase()
    await app.close()
    // I hate jest so much
    if (typeof global.gc === 'function') {
        global.gc()
    }
}

function setupSpies(app: NestExpressApplication) {
    const firebaseApp = app.get<firebase.app.App>(Provider.FIREBASE_ADMIN)
    // @ts-ignore
    jest.spyOn(firebaseApp, 'messaging').mockImplementation(() => ({
        sendMulticast(message: firebase.messaging.MulticastMessage) {
            return Promise.resolve({
                successCount: message.tokens.length,
                failureCount: 0,
                responses: message.tokens.map(() => ({
                    success: true,
                    messageId: uuid()
                }))
            })
        },
        send(message: firebase.messaging.Message) {
            return Promise.resolve(uuid())
        }
    }))
}

function createConfig(): ConfigService {
    const config = new ConfigService()
    const dbUrl = config.get(Environment.DATABASE_URL)

    // solve a problem with a regex, now I have 2 problems :). This just replaces the last occurrence of an
    // '/***' with some text. So mysql://root:example@localhost:9307/equater -> mysql://root:example@localhost:9307/testdb
    config.set(Environment.DATABASE_URL, dbUrl.replace(/\/([^\/]*)$/, '/testdb'))
    config.set(Environment.DB_NAME, 'testdb')
    config.set(Environment.S3_PHOTOS_BUCKET, 'test-equater-photos')
    config.set(Environment.S3_ACCESS_KEY, 'fake')
    config.set(Environment.S3_SECRET_KEY, 'fake')
    config.set(Environment.IS_TESTING, 'true')
    config.set(Environment.VENDOR_ASSETS_S3_BUCKET, 'test-equater-vendor-assets')

    return config
}
