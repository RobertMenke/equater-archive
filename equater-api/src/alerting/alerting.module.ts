import { Module } from '@nestjs/common'
import { Twilio } from 'twilio'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { PoorMansPagerDutyService } from './poor-mans-pager-duty.service'

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: Provider.TWILIO_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                new Twilio(
                    configService.get(Environment.TWILIO_ACCOUNT_SID),
                    configService.get(Environment.TWILIO_AUTH_TOKEN)
                )
        },
        PoorMansPagerDutyService
    ],
    exports: [PoorMansPagerDutyService]
})
export class AlertingModule {}
