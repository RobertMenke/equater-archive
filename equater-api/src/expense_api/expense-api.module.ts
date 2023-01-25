import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { AlertingModule } from '../alerting/alerting.module'
import { ConfigModule } from '../config/config.module'
import { Queues } from '../config/config.service'
import { DwollaModule } from '../dwolla/dwolla.module'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { DwollaWebhookGuard } from '../guards/auth/dwolla-webhook.guard'
import { PlaidModule } from '../plaid/plaid.module'
import { SharedExpenseModule } from '../shared_expense/shared-expense.module'
import { TransactionModule } from '../transaction/transaction.module'
import { TransactionPullModule } from '../transaction_pull/transaction-pull.module'
import { UserModule } from '../user/user.module'
import { DwollaWebhookController } from './dwolla-webhook.controller'
import { ExpenseApiOpsController } from './expense-api-ops.controller'
import { ExpenseApiController } from './expense-api.controller'
import { ExpenseApiDevController } from './expense-api.dev.controller'
import { ExpenseApiService } from './expense-api.service'
import { RecurrentPaymentCronService } from './recurrent-payment.cron.service'
import { RecurrentPaymentProcessor } from './recurrent-payment.processor'
import { SharedExpenseSettlementService } from './shared-expense-settlement.service'
import { TransactionSimulationService } from './transaction-simulation.service'
import { TransactionsUpdateHandler } from './transactions-update.handler'
import { TransferStatusService } from './transfer-status.service'
import { VendorAssociationHandler } from './vendor-association.handler'
import { VerificationCompleteHandler } from './verification-complete.handler'
import { WithheldTransactionCronService } from './withheld-transaction.cron.service'

@Module({
    imports: [
        SharedExpenseModule,
        PlaidModule,
        UserModule,
        TransactionModule,
        TransactionPullModule,
        DwollaModule,
        ConfigModule,
        CqrsModule,
        AlertingModule,
        BullModule.registerQueue({
            name: Queues.RECURRENT_PAYMENTS
        })
    ],
    providers: [
        DwollaWebhookGuard,
        AuthenticationGuard,
        ExpenseApiService,
        TransactionsUpdateHandler,
        TransactionsUpdateHandler,
        VendorAssociationHandler,
        SharedExpenseSettlementService,
        RecurrentPaymentCronService,
        RecurrentPaymentProcessor,
        TransactionSimulationService,
        TransferStatusService,
        WithheldTransactionCronService,
        VerificationCompleteHandler
    ],
    controllers: [ExpenseApiController, DwollaWebhookController, ExpenseApiDevController, ExpenseApiOpsController],
    exports: [ExpenseApiService]
})
export class ExpenseApiModule {}
