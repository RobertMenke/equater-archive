import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AwsModule } from '../aws/aws.module'
import { ConfigModule } from '../config/config.module'
import { DwollaModule } from '../dwolla/dwolla.module'
import { PlaidModule } from '../plaid/plaid.module'
import { PlaidInstitution } from './plaid-institution.entity'
import { UserAccountController } from './user-account.controller'
import { UserAccount } from './user-account.entity'
import { UserAccountService } from './user-account.service'

@Global()
@Module({
    imports: [
        AwsModule,
        ConfigModule,
        DwollaModule,
        PlaidModule,
        TypeOrmModule.forFeature([UserAccount, PlaidInstitution]),
        CqrsModule
    ],
    providers: [UserAccountService],
    controllers: [UserAccountController],
    exports: [UserAccountService]
})
export class UserAccountModule {}
