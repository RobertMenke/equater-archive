import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AlertingModule } from '../alerting/alerting.module'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { DwollaWebhookGuard } from '../guards/auth/dwolla-webhook.guard'
import { DwollaWebhookSubscription } from './dwolla-webhook-subscription.entity'
import { DwollaService } from './dwolla.service'
import { Client } from 'dwolla-v2'

type DwollaEnvironment = 'production' | 'sandbox'

@Module({
    imports: [ConfigModule, AlertingModule, TypeOrmModule.forFeature([DwollaWebhookSubscription])],
    providers: [
        DwollaWebhookGuard,
        DwollaService,
        {
            provide: Provider.DWOLLA_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                new Client({
                    key: configService.get(Environment.DWOLLA_PUBLIC_KEY),
                    secret: configService.get(Environment.DWOLLA_SECRET_KEY),
                    environment: configService.get(Environment.DWOLLA_ENVIRONMENT) as DwollaEnvironment
                })
        }
    ],
    controllers: [],
    exports: [DwollaService]
})
export class DwollaModule {}
