import * as path from 'path'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

// This file should only be used in development to generate migrations
if (process.env.NODE_ENV === 'production') {
    process.exit(1)
}

dotenv.config()

export default new DataSource({
    name: 'default',
    url: process.env.DATABASE_URL,
    database: process.env.DB_NAME,
    type: process.env.DB_ENGINE as 'mysql' | 'mariadb',
    //Z = UTC
    timezone: 'Z',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    migrationsTableName: 'database_migrations',
    migrationsRun: true,
    logging: [/*'query', */ 'error'],
    migrations: [path.join(__dirname, '/../database_migrations/*{.ts,.js}')],
    charset: 'utf8mb4_unicode_ci'
})
