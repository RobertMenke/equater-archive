import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PlaidModule } from '../plaid/plaid.module'
import { TransactionModule } from '../transaction/transaction.module'
import { UserAccountModule } from '../user_account/user-account.module'
import { PlaidTransactionWebhookController } from './plaid-transaction-webhook.controller'
import { TransactionPullService } from './transaction-pull.service'

@Module({
    imports: [TransactionModule, UserAccountModule, PlaidModule, CqrsModule],
    controllers: [PlaidTransactionWebhookController],
    providers: [TransactionPullService],
    exports: [TransactionPullService]
})
export class TransactionPullModule {}
