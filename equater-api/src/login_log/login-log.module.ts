import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoginLog } from './login-log.entity'
import { LoginLogService } from './login-log.service'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([LoginLog])],
    providers: [LoginLogService],
    exports: [LoginLogService]
})
export class LoginLogModule {}
