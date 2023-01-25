import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialMigration1612064916143 implements MigrationInterface {
    name = 'InitialMigration1612064916143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `vendor_transaction_name` (`uniqueVendorId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `transactionName` varchar(255) NOT NULL, `merchantName` varchar(255) NULL DEFAULT NULL, `ppdId` varchar(255) NULL DEFAULT NULL, `dateTimeCreated` datetime NOT NULL, UNIQUE INDEX `IDX_8a955ec21e0153fd895e703977` (`transactionName`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            "CREATE TABLE `unique_vendor` (`id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `friendlyName` varchar(255) NOT NULL COMMENT 'If we have to normalize the vendor name as part of an operational process we will assign a friendly name so that users do not have to deal with confusing merchant transaction names', `ppdId` varchar(255) NULL COMMENT 'ACH PPD_ID for the merchant' DEFAULT NULL, `dateTimeAdded` datetime NOT NULL, `dateTimeModified` datetime NULL DEFAULT NULL, `totalNumberOfExpenseSharingAgreements` int NOT NULL DEFAULT '0', `logoS3Bucket` varchar(255) NULL DEFAULT NULL, `logoS3Key` varchar(255) NULL DEFAULT NULL, `logoUploadCompleted` tinyint NOT NULL DEFAULT 0, `hasBeenReviewedInternally` tinyint NOT NULL COMMENT 'Indicates whether or not a member of our staff has reviewed this vendor name to ensure users have a good experience' DEFAULT 0, `vendorIdentityCannotBeDetermined` tinyint NOT NULL COMMENT 'Some transactions will come in with names like “Interest Payment” with no PPD ID. There’s no way we can actually identify where this is coming from and therefore want to filter these out of our system.' DEFAULT 0, UNIQUE INDEX `IDX_54e6d600abf28ca22196494475` (`uuid`), UNIQUE INDEX `IDX_f1a35d7ae75078b67da8124cc8` (`friendlyName`), UNIQUE INDEX `IDX_833169ae7156fce9dc0d3b0ece` (`ppdId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `user_invite` (`sharedExpenseId` int NULL, `id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, `uuid` char(36) NOT NULL, `contributionType` int NOT NULL, `contributionValue` int NULL COMMENT 'Stored in a form intended to be parsed by Dinero.js', `dateTimeCreated` datetime NOT NULL, `isConverted` tinyint NOT NULL, `dateTimeBecameUser` datetime NULL DEFAULT NULL, `initiatingUserId` int NULL, INDEX `IDX_4782feb92faa0e0a1ce81afb46` (`email`), UNIQUE INDEX `IDX_7e179b3fe35d8c6eda190323d7` (`uuid`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `user_account` (`userId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `accountId` varchar(255) NOT NULL, `accountName` varchar(255) NOT NULL, `accountSubType` varchar(255) NOT NULL, `accountType` varchar(255) NOT NULL, `accountMask` text NOT NULL, `institutionId` varchar(255) NOT NULL, `institutionName` varchar(255) NOT NULL, `plaidPublicToken` text NULL, `plaidAccessToken` text NULL, `plaidItemId` varchar(255) NULL, `isActive` tinyint NOT NULL DEFAULT 0, `hasRemovedFundingSource` tinyint NOT NULL DEFAULT 0, `dwollaFundingSourceId` varchar(255) NULL DEFAULT NULL, `dwollaFundingSourceUrl` varchar(255) NULL DEFAULT NULL, `dateOfLastPlaidTransactionPull` datetime NULL DEFAULT NULL, `isDefaultUsedForPayment` tinyint NOT NULL COMMENT 'Designates whether or not this card will be used to pay others (decided upon when accepting an expense agreement)' DEFAULT 0, `plaidLinkToken` text NULL DEFAULT NULL, `dateTimePlaidLinkTokenExpires` datetime NULL DEFAULT NULL, `requiresPlaidReAuthentication` tinyint NOT NULL DEFAULT 0, `dateTimeCreated` datetime NULL, UNIQUE INDEX `IDX_d681a74722b577ba983124a55f` (`accountId`), INDEX `IDX_f79008d7da2f36a0ef1a611782` (`plaidItemId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `shared_expense` (`uniqueVendorId` int NULL DEFAULT NULL, `expenseOwnerUserId` int NOT NULL, `expenseOwnerDestinationAccountId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `expenseNickName` varchar(1024) NOT NULL DEFAULT '', `dateTimeCreated` datetime NOT NULL, `isActive` tinyint NOT NULL, `isPending` tinyint NOT NULL, `sharedExpenseType` tinyint NOT NULL, `expenseRecurrenceInterval` tinyint NULL DEFAULT NULL, `expenseRecurrenceFrequency` int NULL DEFAULT NULL, `targetDateOfFirstCharge` datetime NULL DEFAULT NULL, `dateLastCharged` datetime NULL DEFAULT NULL, `dateNextPaymentScheduled` datetime NULL DEFAULT NULL, `recurringPaymentEndDate` datetime NULL DEFAULT NULL, `dateTimeDeactivated` datetime NULL DEFAULT NULL, UNIQUE INDEX `IDX_9b22ac394f54f9a62a42e7a657` (`uuid`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `shared_expense_user_agreement` (`sharedExpenseId` int NOT NULL, `userId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `contributionType` int NOT NULL, `contributionValue` int NULL COMMENT 'Stored in a form intended to be parsed by Dinero.js. Will be null in the case that ExpenseContributionType.SPLIT_EVENLY is selected.' DEFAULT NULL, `isPending` tinyint NOT NULL, `isActive` tinyint NOT NULL, `dateTimeCreated` datetime NOT NULL, `dateTimeBecameActive` datetime NULL DEFAULT NULL, `dateTimeBecameInactive` datetime NULL DEFAULT NULL, UNIQUE INDEX `IDX_1089447adb1a04eb6adb6d76a6` (`uuid`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `shared_expense_withheld_transaction` (`sharedExpenseUserAgreementId` int NOT NULL, `sharedExpenseTransactionId` int NULL DEFAULT NULL, `plaidTransactionId` int NULL DEFAULT NULL, `id` int NOT NULL AUTO_INCREMENT, `withholdingReason` int NOT NULL, `fundsAvailableAtTimeOfAttemptedTransaction` int NULL DEFAULT NULL, `totalContributionAmount` int NOT NULL COMMENT 'Amount the user was supposed to contribute to this transaction', `dateTimeAttempted` datetime NOT NULL, `hasBeenReconciled` tinyint NOT NULL, `dateTimeReconciled` datetime NULL DEFAULT NULL, `dateTimeOriginalPaymentScheduled` datetime NULL COMMENT 'Used to uniquely identify recurring payments' DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            "CREATE TABLE `transaction` (`accountId` int NOT NULL, `uniqueVendorId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `categoryId` varchar(255) NOT NULL, `pendingTransactionId` varchar(255) NULL, `transactionId` varchar(255) NOT NULL, `accountOwner` varchar(255) NULL, `amount` int NOT NULL COMMENT 'The settled dollar value. Positive values when money moves out of the account; negative values when money moves in. For example, purchases are positive; credit card payments, direct deposits, refunds are negative.', `date` date NOT NULL COMMENT 'For pending transactions, Plaid returns the date the transaction occurred; for posted transactions, Plaid returns the date the transaction posts. Both dates are returned in an ISO 8601 format (YYYY-MM-DD).', `authorizedDate` datetime NULL COMMENT 'The date that the transaction was authorized. Dates are returned in an ISO 8601 format (YYYY-MM-DD).', `dateTimeCaptured` datetime NOT NULL COMMENT 'DateTime that we recorded the transaction from Plaid', `isoCurrencyCode` varchar(255) NULL, `isPending` tinyint NOT NULL, `transactionType` varchar(255) NULL, `unofficialCurrencyCode` varchar(255) NULL, `plaidWebHookCode` int NOT NULL, `paymentChannel` varchar(255) NULL COMMENT 'The channel used to make a payment. Possible values are: online, in store, other. This field will replace the transaction_type field.', `address` varchar(255) NULL, `city` varchar(255) NULL, `country` varchar(255) NULL, `latitude` int NULL, `longitude` int NULL, `postalCode` varchar(255) NULL, `region` varchar(255) NULL, `storeNumber` varchar(255) NULL COMMENT 'The merchant defined store number where the transaction occurred.', `byOrderOf` varchar(255) NULL, `payee` varchar(255) NULL COMMENT 'For transfers, the party that is receiving the transaction.', `payer` varchar(255) NULL, `paymentMethod` varchar(255) NULL, `paymentProcessor` varchar(255) NULL, `ppdId` varchar(255) NULL COMMENT 'The ACH PPD ID for the payer.', `reason` varchar(255) NULL, `referenceNumber` varchar(255) NULL COMMENT 'The transaction reference number supplied by the financial institution.', UNIQUE INDEX `IDX_bdcf2c929b61c0935576652d9b` (`transactionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            'CREATE TABLE `shared_expense_transaction_log` (`id` int NOT NULL AUTO_INCREMENT, `sharedExpenseTransactionId` int NOT NULL, `uuid` char(36) NOT NULL, `event` varchar(255) NOT NULL, `eventUrl` varchar(255) NOT NULL, `dateTimePosted` datetime NOT NULL, INDEX `IDX_914658689d271a9cfa87872645` (`sharedExpenseTransactionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            "CREATE TABLE `shared_expense_transaction` (`plaidTransactionId` int NULL DEFAULT NULL, `sharedExpenseId` int NOT NULL, `sharedExpenseUserAgreementId` int NOT NULL, `sourceAccountId` int NOT NULL, `destinationAccountId` int NOT NULL, `sourceUserId` int NOT NULL, `destinationUserId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `totalTransactionAmount` int NOT NULL COMMENT 'Total contributionValue owed by the source to the destination', `totalFeeAmount` int NOT NULL COMMENT 'Total contributionValue that we will charge as a service fee for this transaction', `idempotencyToken` char(36) NOT NULL COMMENT 'Token used to ensure we do not charge users more than once for the same transaction', `dateTimeInitiated` datetime NOT NULL, `hasBeenTransferredToDestination` tinyint NOT NULL, `dateTimeTransferredToDestination` datetime NULL, `numberOfTimesAttempted` int NOT NULL DEFAULT '0', `dateTimeTransactionScheduled` datetime NULL COMMENT 'For recurring payments we need to be able to identify a transaction by the date the payment was originally scheduled' DEFAULT NULL, `dwollaTransferUrl` varchar(255) NULL DEFAULT NULL, `dwollaTransferId` varchar(255) NULL DEFAULT NULL, `dwollaStatus` varchar(255) NULL DEFAULT NULL, `dateTimeDwollaStatusUpdated` datetime NULL DEFAULT NULL, UNIQUE INDEX `IDX_6bc9e2920d1ab64db9f98bbcd4` (`idempotencyToken`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        )
        await queryRunner.query(
            'CREATE TABLE `login_log` (`userId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `ipAddress` varchar(40) NOT NULL, `sessionId` varchar(100) NULL, `userAgent` text NOT NULL, `dateTimeAuthenticated` datetime NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `relationship` (`originatingUserId` int NOT NULL, `consentingUserId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `isConfirmed` tinyint NOT NULL DEFAULT 0, `dateTimeCreated` datetime NOT NULL, `dateTimeConfirmed` datetime NULL DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `email` varchar(100) NOT NULL, `password` char(60) NOT NULL, `firstName` varchar(255) NOT NULL, `lastName` varchar(255) NOT NULL, `role` varchar(255) NOT NULL, `addressOne` varchar(255) NULL, `addressTwo` varchar(255) NULL, `city` varchar(255) NULL, `state` varchar(255) NULL, `postalCode` varchar(255) NULL, `dateOfBirth` datetime NULL, `lastFourOfSsn` text NULL, `emailIsConfirmed` tinyint NOT NULL, `emailVerificationCode` varchar(255) NULL DEFAULT NULL, `emailVerificationExpirationDate` datetime NULL DEFAULT NULL, `passwordResetCode` varchar(255) NULL DEFAULT NULL, `passwordResetExpirationDate` datetime NULL DEFAULT NULL, `dateTimeCreated` datetime NOT NULL, `profilePhotoUploadCompleted` tinyint NOT NULL, `profilePhotoMimeType` varchar(255) NULL DEFAULT NULL, `coverPhotoUploadCompleted` tinyint NOT NULL, `coverPhotoMimeType` varchar(255) NULL DEFAULT NULL, `dwollaCustomerId` varchar(255) NULL DEFAULT NULL, `dwollaCustomerUrl` varchar(255) NULL DEFAULT NULL, `dwollaCustomerStatus` tinyint NOT NULL, `plaidLinkToken` text NULL DEFAULT NULL, `dateTimePlaidLinkTokenExpires` datetime NULL DEFAULT NULL, `disclosureOfFeesResponse` int NOT NULL, `onBoardingSelection` varchar(255) NULL DEFAULT NULL, `onBoardingAdditionalFeedback` text NULL DEFAULT NULL, UNIQUE INDEX `IDX_a95e949168be7b7ece1a2382fe` (`uuid`), UNIQUE INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` (`email`), UNIQUE INDEX `IDX_6cd38296ce7f7abc926f57c93d` (`emailVerificationCode`), UNIQUE INDEX `IDX_0765c28cecd4f10e2e16bde134` (`passwordResetCode`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `user_device` (`userId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `fcmToken` varchar(255) NULL, `deviceModel` varchar(255) NULL DEFAULT NULL, `deviceOsVersion` varchar(255) NULL DEFAULT NULL, `deviceOsName` varchar(255) NULL DEFAULT NULL, `dateTimeDeviceRegistered` datetime NOT NULL, UNIQUE INDEX `IDX_034f6dc930c25b5d315462ca9b` (`fcmToken`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `push_notification` (`deviceId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `messageId` varchar(255) NULL DEFAULT NULL, `title` varchar(255) NULL DEFAULT NULL, `body` varchar(255) NULL DEFAULT NULL, `dateTimeAttempted` datetime NOT NULL, `status` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `dwolla_webhook_subscription` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(255) NOT NULL, `secret` text NOT NULL, `dwollaSubscriptionUrl` varchar(255) NOT NULL, `isActive` tinyint NOT NULL, `dateTimeCreated` datetime NOT NULL, `dateTimeUpdated` datetime NULL DEFAULT NULL, UNIQUE INDEX `IDX_b65b41ea7bf89a7f3621242923` (`uuid`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `newsletter_recipient` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, UNIQUE INDEX `IDX_293bf92585984c006112d6faa1` (`email`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `plaid_category` (`id` int NOT NULL AUTO_INCREMENT, `categoryId` varchar(255) NOT NULL, `type` varchar(25) NOT NULL, UNIQUE INDEX `IDX_5aea4d5f2967da994d7bff467b` (`categoryId`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `plaid_category_hierarchy` (`id` int NOT NULL AUTO_INCREMENT, `plaidCategoryId` int NULL, `plaidCategoryHierarchyDescriptionId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'CREATE TABLE `plaid_category_description` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, UNIQUE INDEX `IDX_19c631dd6915c7bae84a15db1e` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
        )
        await queryRunner.query(
            'ALTER TABLE `vendor_transaction_name` ADD CONSTRAINT `FK_3782d1e3ba71f733016cba12792` FOREIGN KEY (`uniqueVendorId`) REFERENCES `unique_vendor`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `user_invite` ADD CONSTRAINT `FK_946361fe40d77ac0782852672da` FOREIGN KEY (`sharedExpenseId`) REFERENCES `shared_expense`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `user_invite` ADD CONSTRAINT `FK_9afce7b73bb5b42077fec68ed60` FOREIGN KEY (`initiatingUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `user_account` ADD CONSTRAINT `FK_08023c572a6a0a22798c56d6c17` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` ADD CONSTRAINT `FK_f4b23b12e8984785ffd6281322b` FOREIGN KEY (`uniqueVendorId`) REFERENCES `unique_vendor`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` ADD CONSTRAINT `FK_55301805e9d3b304519b0572b4b` FOREIGN KEY (`expenseOwnerUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` ADD CONSTRAINT `FK_f975c3eedf20aff0e5e3e945120` FOREIGN KEY (`expenseOwnerDestinationAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` ADD CONSTRAINT `FK_7d9ff408373392ea325bcd9c9d4` FOREIGN KEY (`sharedExpenseId`) REFERENCES `shared_expense`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` ADD CONSTRAINT `FK_99766c55b75f9eabd6c1100b9e9` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` ADD CONSTRAINT `FK_4288562deea42050d44b2aa3cd2` FOREIGN KEY (`sharedExpenseUserAgreementId`) REFERENCES `shared_expense_user_agreement`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` ADD CONSTRAINT `FK_7438fa613e6d4650ef8ecf6ba6b` FOREIGN KEY (`sharedExpenseTransactionId`) REFERENCES `shared_expense_transaction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` ADD CONSTRAINT `FK_cf7d04874cdd1ea24e15c55d63c` FOREIGN KEY (`plaidTransactionId`) REFERENCES `transaction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `transaction` ADD CONSTRAINT `FK_3d6e89b14baa44a71870450d14d` FOREIGN KEY (`accountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `transaction` ADD CONSTRAINT `FK_bbdd1c60297d5df4a865cefa450` FOREIGN KEY (`uniqueVendorId`) REFERENCES `unique_vendor`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction_log` ADD CONSTRAINT `FK_914658689d271a9cfa878726452` FOREIGN KEY (`sharedExpenseTransactionId`) REFERENCES `shared_expense_transaction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_925b1522440cde38eec67db2e3f` FOREIGN KEY (`plaidTransactionId`) REFERENCES `transaction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_18f0e37ec58dd5c6ca84873ed70` FOREIGN KEY (`sharedExpenseId`) REFERENCES `shared_expense`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_e6fef31b4571e25c61cfe42785e` FOREIGN KEY (`sharedExpenseUserAgreementId`) REFERENCES `shared_expense_user_agreement`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_9b9463bce79bb9e354259b49d2a` FOREIGN KEY (`sourceAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_e020af7d311616c044afc2d8d1f` FOREIGN KEY (`destinationAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_6a8164defd44fa900a48c497c9b` FOREIGN KEY (`sourceUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD CONSTRAINT `FK_62cc11fe22bd7d92001cb2c4536` FOREIGN KEY (`destinationUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `login_log` ADD CONSTRAINT `FK_fa34abc1d6d5b7c762fd0ccba96` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `relationship` ADD CONSTRAINT `FK_55e4a7d52bc067f105c2a31b052` FOREIGN KEY (`originatingUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `relationship` ADD CONSTRAINT `FK_6f7c5c15e18a628f37c0a33f698` FOREIGN KEY (`consentingUserId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `user_device` ADD CONSTRAINT `FK_bda1afb30d9e3e8fb30b1e90af7` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `push_notification` ADD CONSTRAINT `FK_9fcfaf66afbdc7cab02310c5c48` FOREIGN KEY (`deviceId`) REFERENCES `user_device`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_ded3a65cf116fb0e45679498dab` FOREIGN KEY (`plaidCategoryId`) REFERENCES `plaid_category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_79fb0656c6fbb66ed66db63229b` FOREIGN KEY (`plaidCategoryHierarchyDescriptionId`) REFERENCES `plaid_category_description`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_79fb0656c6fbb66ed66db63229b`'
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_ded3a65cf116fb0e45679498dab`'
        )
        await queryRunner.query('ALTER TABLE `push_notification` DROP FOREIGN KEY `FK_9fcfaf66afbdc7cab02310c5c48`')
        await queryRunner.query('ALTER TABLE `user_device` DROP FOREIGN KEY `FK_bda1afb30d9e3e8fb30b1e90af7`')
        await queryRunner.query('ALTER TABLE `relationship` DROP FOREIGN KEY `FK_6f7c5c15e18a628f37c0a33f698`')
        await queryRunner.query('ALTER TABLE `relationship` DROP FOREIGN KEY `FK_55e4a7d52bc067f105c2a31b052`')
        await queryRunner.query('ALTER TABLE `login_log` DROP FOREIGN KEY `FK_fa34abc1d6d5b7c762fd0ccba96`')
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_62cc11fe22bd7d92001cb2c4536`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_6a8164defd44fa900a48c497c9b`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_e020af7d311616c044afc2d8d1f`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_9b9463bce79bb9e354259b49d2a`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_e6fef31b4571e25c61cfe42785e`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_18f0e37ec58dd5c6ca84873ed70`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` DROP FOREIGN KEY `FK_925b1522440cde38eec67db2e3f`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction_log` DROP FOREIGN KEY `FK_914658689d271a9cfa878726452`'
        )
        await queryRunner.query('ALTER TABLE `transaction` DROP FOREIGN KEY `FK_bbdd1c60297d5df4a865cefa450`')
        await queryRunner.query('ALTER TABLE `transaction` DROP FOREIGN KEY `FK_3d6e89b14baa44a71870450d14d`')
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` DROP FOREIGN KEY `FK_cf7d04874cdd1ea24e15c55d63c`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` DROP FOREIGN KEY `FK_7438fa613e6d4650ef8ecf6ba6b`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` DROP FOREIGN KEY `FK_4288562deea42050d44b2aa3cd2`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` DROP FOREIGN KEY `FK_99766c55b75f9eabd6c1100b9e9`'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` DROP FOREIGN KEY `FK_7d9ff408373392ea325bcd9c9d4`'
        )
        await queryRunner.query('ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_f975c3eedf20aff0e5e3e945120`')
        await queryRunner.query('ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_55301805e9d3b304519b0572b4b`')
        await queryRunner.query('ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_f4b23b12e8984785ffd6281322b`')
        await queryRunner.query('ALTER TABLE `user_account` DROP FOREIGN KEY `FK_08023c572a6a0a22798c56d6c17`')
        await queryRunner.query('ALTER TABLE `user_invite` DROP FOREIGN KEY `FK_9afce7b73bb5b42077fec68ed60`')
        await queryRunner.query('ALTER TABLE `user_invite` DROP FOREIGN KEY `FK_946361fe40d77ac0782852672da`')
        await queryRunner.query(
            'ALTER TABLE `vendor_transaction_name` DROP FOREIGN KEY `FK_3782d1e3ba71f733016cba12792`'
        )
        await queryRunner.query('DROP INDEX `IDX_19c631dd6915c7bae84a15db1e` ON `plaid_category_description`')
        await queryRunner.query('DROP TABLE `plaid_category_description`')
        await queryRunner.query('DROP TABLE `plaid_category_hierarchy`')
        await queryRunner.query('DROP INDEX `IDX_5aea4d5f2967da994d7bff467b` ON `plaid_category`')
        await queryRunner.query('DROP TABLE `plaid_category`')
        await queryRunner.query('DROP INDEX `IDX_293bf92585984c006112d6faa1` ON `newsletter_recipient`')
        await queryRunner.query('DROP TABLE `newsletter_recipient`')
        await queryRunner.query('DROP INDEX `IDX_b65b41ea7bf89a7f3621242923` ON `dwolla_webhook_subscription`')
        await queryRunner.query('DROP TABLE `dwolla_webhook_subscription`')
        await queryRunner.query('DROP TABLE `push_notification`')
        await queryRunner.query('DROP INDEX `IDX_034f6dc930c25b5d315462ca9b` ON `user_device`')
        await queryRunner.query('DROP TABLE `user_device`')
        await queryRunner.query('DROP INDEX `IDX_0765c28cecd4f10e2e16bde134` ON `user`')
        await queryRunner.query('DROP INDEX `IDX_6cd38296ce7f7abc926f57c93d` ON `user`')
        await queryRunner.query('DROP INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` ON `user`')
        await queryRunner.query('DROP INDEX `IDX_a95e949168be7b7ece1a2382fe` ON `user`')
        await queryRunner.query('DROP TABLE `user`')
        await queryRunner.query('DROP TABLE `relationship`')
        await queryRunner.query('DROP TABLE `login_log`')
        await queryRunner.query('DROP INDEX `IDX_6bc9e2920d1ab64db9f98bbcd4` ON `shared_expense_transaction`')
        await queryRunner.query('DROP TABLE `shared_expense_transaction`')
        await queryRunner.query('DROP INDEX `IDX_914658689d271a9cfa87872645` ON `shared_expense_transaction_log`')
        await queryRunner.query('DROP TABLE `shared_expense_transaction_log`')
        await queryRunner.query('DROP INDEX `IDX_bdcf2c929b61c0935576652d9b` ON `transaction`')
        await queryRunner.query('DROP TABLE `transaction`')
        await queryRunner.query('DROP TABLE `shared_expense_withheld_transaction`')
        await queryRunner.query('DROP INDEX `IDX_1089447adb1a04eb6adb6d76a6` ON `shared_expense_user_agreement`')
        await queryRunner.query('DROP TABLE `shared_expense_user_agreement`')
        await queryRunner.query('DROP INDEX `IDX_9b22ac394f54f9a62a42e7a657` ON `shared_expense`')
        await queryRunner.query('DROP TABLE `shared_expense`')
        await queryRunner.query('DROP INDEX `IDX_f79008d7da2f36a0ef1a611782` ON `user_account`')
        await queryRunner.query('DROP INDEX `IDX_d681a74722b577ba983124a55f` ON `user_account`')
        await queryRunner.query('DROP TABLE `user_account`')
        await queryRunner.query('DROP INDEX `IDX_7e179b3fe35d8c6eda190323d7` ON `user_invite`')
        await queryRunner.query('DROP INDEX `IDX_4782feb92faa0e0a1ce81afb46` ON `user_invite`')
        await queryRunner.query('DROP TABLE `user_invite`')
        await queryRunner.query('DROP INDEX `IDX_833169ae7156fce9dc0d3b0ece` ON `unique_vendor`')
        await queryRunner.query('DROP INDEX `IDX_f1a35d7ae75078b67da8124cc8` ON `unique_vendor`')
        await queryRunner.query('DROP INDEX `IDX_54e6d600abf28ca22196494475` ON `unique_vendor`')
        await queryRunner.query('DROP TABLE `unique_vendor`')
        await queryRunner.query('DROP INDEX `IDX_8a955ec21e0153fd895e703977` ON `vendor_transaction_name`')
        await queryRunner.query('DROP TABLE `vendor_transaction_name`')
    }
}
