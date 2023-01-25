import { Injectable } from '@nestjs/common'
import { TypeOrmOptionsFactory } from '@nestjs/typeorm'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { DataSourceOptions } from 'typeorm'
import { ConfigService, Environment } from './config.service'

@Injectable()
export class DatabaseConfigurationServiceFake implements TypeOrmOptionsFactory {
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
            synchronize: true,
            dropSchema: true,
            charset: 'utf8mb4'
            // logging: ['query']
        }
    }
}
