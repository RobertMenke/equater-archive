import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AccountDeletionModule } from '../account_deletion/account-deletion.module'
import { BullModuleOptionsFactory } from '../config/bull-module-options.factory'
import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/config.service'
import { DatabaseConfigurationService } from '../config/database-configuration.service'
import { ExpenseApiModule } from '../expense_api/expense-api.module'
import { NewsletterModule } from '../newsletter/newsletter.module'
import { PlaidModule } from '../plaid/plaid.module'
import { SharedExpenseModule } from '../shared_expense/shared-expense.module'
import { SocketModule } from '../socket/socket.module'
import { UserModule } from '../user/user.module'
import { UserAccountModule } from '../user_account/user-account.module'
import { AppController } from './app.controller'

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useClass: DatabaseConfigurationService
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useClass: BullModuleOptionsFactory
        }),
        ConfigModule,
        UserAccountModule,
        UserModule,
        PlaidModule,
        SocketModule,
        ExpenseApiModule,
        NewsletterModule,
        SharedExpenseModule,
        AccountDeletionModule
    ],
    controllers: [AppController]
})
export class AppModule {}
