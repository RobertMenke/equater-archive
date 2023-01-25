import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AwsModule } from '../aws/aws.module'
import { ConfigModule } from '../config/config.module'
import { PushNotification } from '../device/push-notification.entity'
import { UserDevice } from '../device/user-device.entity'
import { ExpenseApiModule } from '../expense_api/expense-api.module'
import { LoginLog } from '../login_log/login-log.entity'
import { NewsletterRecipient } from '../newsletter/newsletter-recipient.entity'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { PlaidModule } from '../plaid/plaid.module'
import { PlaidCategoryDescription } from '../plaid_category/plaid-category-description.entity'
import { PlaidCategoryHierarchy } from '../plaid_category/plaid-category-hierarchy.entity'
import { PlaidCategory } from '../plaid_category/plaid-category.entity'
import { SharedExpenseTransactionLog } from '../shared_expense/shared-expense-transaction-log.entity'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { SharedExpenseWithheldTransaction } from '../shared_expense/shared-expense-withheld-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseModule } from '../shared_expense/shared-expense.module'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionModule } from '../transaction/transaction.module'
import { UniqueVendorAssociation } from '../transaction/unique-vendor-association.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorTransactionName } from '../transaction/vendor-transaction-name.entity'
import { TransactionPullModule } from '../transaction_pull/transaction-pull.module'
import { Relationship } from '../user/relationship.entity'
import { UserInvite } from '../user/user-invite.entity'
import { User } from '../user/user.entity'
import { UserModule } from '../user/user.module'
import { PlaidInstitution } from '../user_account/plaid-institution.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountModule } from '../user_account/user-account.module'
import { PlaidMockService } from './plaid-mock.service'
import { PlaidSeedService } from './plaid-seed.service'
import { SeedingService } from './seeding.service'
import { SharedExpenseSeedService } from './shared-expense-seed.service'
import { TransactionSeedService } from './transaction-seed.service'
import { UserSeedService } from './user-seed.service'

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            UserAccount,
            UserInvite,
            UserDevice,
            Relationship,
            LoginLog,
            Transaction,
            UniqueVendor,
            UniqueVendorAssociation,
            VendorTransactionName,
            PlaidLinkToken,
            PlaidCategory,
            PlaidCategoryDescription,
            PlaidCategoryHierarchy,
            PlaidInstitution,
            PushNotification,
            SharedExpense,
            SharedExpenseUserAgreement,
            SharedExpenseTransaction,
            SharedExpenseWithheldTransaction,
            SharedExpenseTransactionLog,
            NewsletterRecipient
        ]),
        UserModule,
        UserAccountModule,
        SharedExpenseModule,
        ExpenseApiModule,
        TransactionPullModule,
        TransactionModule,
        AwsModule,
        ConfigModule,
        CqrsModule,
        PlaidModule
    ],
    providers: [
        SeedingService,
        UserSeedService,
        SharedExpenseSeedService,
        SharedExpenseService,
        PlaidSeedService,
        PlaidMockService,
        TransactionSeedService
    ],
    exports: [SeedingService, PlaidMockService]
})
export class SeedingModule {}
