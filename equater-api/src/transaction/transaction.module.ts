import { CacheModule, Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AlertingModule } from '../alerting/alerting.module'
import { AwsModule } from '../aws/aws.module'
import { CacheModuleOptionsFactory } from '../config/cache-module-options.factory'
import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/config.service'
import { PlaidCategoryModule } from '../plaid_category/plaid-category.module'
import { UserAccountModule } from '../user_account/user-account.module'
import { LogoFetchService } from './logo-fetch.service'
import { TransactionController } from './transaction.controller'
import { Transaction } from './transaction.entity'
import { TransactionService } from './transaction.service'
import { UniqueVendorAssociation } from './unique-vendor-association.entity'
import { UniqueVendor } from './unique-vendor.entity'
import { VendorTransactionName } from './vendor-transaction-name.entity'
import { VendorController } from './vendor.controller'
import { VendorService } from './vendor.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, UniqueVendor, VendorTransactionName, UniqueVendorAssociation]),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useClass: CacheModuleOptionsFactory
        }),
        HttpModule,
        AwsModule,
        ConfigModule,
        CqrsModule,
        AlertingModule,
        PlaidCategoryModule,
        UserAccountModule
    ],
    providers: [TransactionService, VendorService, LogoFetchService],
    controllers: [VendorController, TransactionController],
    exports: [TransactionService, VendorService]
})
export class TransactionModule {}
