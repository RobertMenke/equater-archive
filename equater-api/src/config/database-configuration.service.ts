import { Injectable } from '@nestjs/common'
import { TypeOrmOptionsFactory } from '@nestjs/typeorm'
import * as path from 'path'
import { DataSourceOptions } from 'typeorm'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { ConfigService, Environment } from './config.service'

@Injectable()
export class DatabaseConfigurationService implements TypeOrmOptionsFactory {
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
            migrationsTableName: 'database_migrations',
            migrationsRun: true,
            logging: [/*'query', */ 'error'],
            migrations: [path.join(__dirname, '/../database_migrations/*{.ts,.js}')],
            charset: 'utf8mb4_unicode_ci'
        }
    }
}
