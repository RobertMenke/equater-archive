import { MigrationInterface, QueryRunner } from 'typeorm'

export class DateTimePrecision1613328045421 implements MigrationInterface {
    name = 'DateTimePrecision1613328045421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateTimeCreated` `dateTimeCreated` datetime(6) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `targetDateOfFirstCharge` `targetDateOfFirstCharge` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateLastCharged` `dateLastCharged` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateNextPaymentScheduled` `dateNextPaymentScheduled` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `recurringPaymentEndDate` `recurringPaymentEndDate` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateTimeDeactivated` `dateTimeDeactivated` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeAttempted` `dateTimeAttempted` datetime(6) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeReconciled` `dateTimeReconciled` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeOriginalPaymentScheduled` `dateTimeOriginalPaymentScheduled` datetime(6) NULL COMMENT 'Used to uniquely identify recurring payments'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction_log` CHANGE `dateTimePosted` `dateTimePosted` datetime(6) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeInitiated` `dateTimeInitiated` datetime(6) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeTransferredToDestination` `dateTimeTransferredToDestination` datetime(6) NULL',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeTransactionScheduled` `dateTimeTransactionScheduled` datetime(6) NULL COMMENT 'For recurring payments we need to be able to identify a transaction by the date the payment was originally scheduled'",
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeTransactionScheduled` `dateTimeTransactionScheduled` datetime(0) NULL COMMENT 'For recurring payments we need to be able to identify a transaction by the date the payment was originally scheduled'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeTransferredToDestination` `dateTimeTransferredToDestination` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` CHANGE `dateTimeInitiated` `dateTimeInitiated` datetime(0) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction_log` CHANGE `dateTimePosted` `dateTimePosted` datetime(0) NOT NULL',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeOriginalPaymentScheduled` `dateTimeOriginalPaymentScheduled` datetime(0) NULL COMMENT 'Used to uniquely identify recurring payments'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeReconciled` `dateTimeReconciled` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_withheld_transaction` CHANGE `dateTimeAttempted` `dateTimeAttempted` datetime(0) NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateTimeDeactivated` `dateTimeDeactivated` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `recurringPaymentEndDate` `recurringPaymentEndDate` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateNextPaymentScheduled` `dateNextPaymentScheduled` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateLastCharged` `dateLastCharged` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `targetDateOfFirstCharge` `targetDateOfFirstCharge` datetime(0) NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` CHANGE `dateTimeCreated` `dateTimeCreated` datetime(0) NOT NULL',
            undefined
        )
    }
}
