import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { EmailService } from './email.service'

@Global()
@Module({
    imports: [ConfigModule],
    providers: [EmailService],
    exports: [EmailService]
})
export class EmailModule {}
