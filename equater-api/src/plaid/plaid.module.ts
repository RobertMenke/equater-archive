import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Configuration, PlaidApi } from 'plaid'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { DevelopmentGuard } from '../guards/dev/development.guard'
import { PlaidCategoryModule } from '../plaid_category/plaid-category.module'
import { PlaidCronService } from './plaid-cron.service'
import { PlaidDevelopmentController } from './plaid-development.controller'
import { PlaidLinkToken } from './plaid-link-token.entity'
import { PlaidLinkTokenService } from './plaid-link-token.service'
import { PlaidService } from './plaid.service'

@Global()
@Module({
    imports: [PlaidCategoryModule, CqrsModule, ConfigModule, TypeOrmModule.forFeature([PlaidLinkToken])],
    controllers: [PlaidDevelopmentController],
    providers: [
        {
            provide: Provider.PLAID_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                new PlaidApi(
                    new Configuration({
                        basePath: configService.getPlaidEnvironment(),
                        baseOptions: {
                            headers: {
                                'PLAID-CLIENT-ID': configService.get(Environment.PLAID_CLIENT_ID),
                                'PLAID-SECRET': configService.get(Environment.PLAID_SECRET_KEY)
                            }
                        }
                    })
                )
        },
        PlaidLinkTokenService,
        PlaidService,
        PlaidCronService,
        AuthenticationGuard,
        DevelopmentGuard
    ],
    exports: [PlaidService, PlaidLinkTokenService]
})
export class PlaidModule {}
