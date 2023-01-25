import { Injectable } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { TypeOrmOptionsFactory } from '@nestjs/typeorm'
import * as fs from 'fs'
import * as path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { finishDatabaseTestingTransaction, makeAppBuilder, resetTestingState, teardown } from '../setup.test'
import { ConfigService, Environment } from './config.service'
import { DatabaseConfigurationService } from './database-configuration.service'

describe('Database Migrations', () => {
    let app: NestExpressApplication

    beforeAll(async () => {
        const builder = makeAppBuilder()
        builder
            .overrideProvider(DatabaseConfigurationService)
            .useClass(DatabaseConfigurationServiceFakeForMigrationsTest)

        const testingModule = await builder.compile()
        app = testingModule.createNestApplication<NestExpressApplication>()
        await app.init()
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

    it('Should run all migrations successfully', async () => {
        const migrationsDir = path.join(__dirname, '../database_migrations')
        const migrationNames = fs.readdirSync(migrationsDir).map((name) => name.replace('.ts', ''))
        const db = app.get<DataSource>(DataSource)
        const migrationsRun = await db.runMigrations()

        expect(migrationsRun.length).toBe(migrationNames.length)

        for (const migration of migrationsRun) {
            const expectedMigration = migrationNames.find((name) => name === migration.name)
            expect(expectedMigration).not.toBeNull()
        }
    })
})

// This fake explicitly has synchronize set to false
@Injectable()
class DatabaseConfigurationServiceFakeForMigrationsTest implements TypeOrmOptionsFactory {
    constructor(private readonly configService: ConfigService) {}
    createTypeOrmOptions(_?: string): Partial<MysqlConnectionOptions> | Partial<DataSourceOptions> {
        return {
            name: 'default',
            url: this.configService.get(Environment.DATABASE_URL),
            database: this.configService.get(Environment.DB_NAME),
            type: this.configService.get(Environment.DB_ENGINE) as 'mysql' | 'mariadb',
            //Z = UTC
            timezone: 'Z',
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: false,
            dropSchema: true,
            migrationsTableName: 'database_migrations',
            migrations: [path.join(__dirname, '/../database_migrations/*{.ts,.js}')],
            charset: 'utf8mb4'
            // logging: ['query']
        }
    }
}
