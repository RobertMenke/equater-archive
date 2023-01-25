import { MigrationInterface, QueryRunner } from 'typeorm'

export class SupportCreditCards1629582483630 implements MigrationInterface {
    name = 'SupportCreditCards1629582483630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_f975c3eedf20aff0e5e3e945120`',
            undefined
        )
        await queryRunner.query(
            `ALTER TABLE \`shared_expense\` ADD CONSTRAINT \`FK_ac29413be2d91abb43a98b0c543\` FOREIGN KEY (\`expenseOwnerDestinationAccountId\`) REFERENCES \`user_account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
        )
        await queryRunner.query(
            "ALTER TABLE `shared_expense` ADD `expenseOwnerSourceAccountId` int NOT NULL COMMENT 'The account used to detect a matching shared expense. This account may be a credit card or a depository account.'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` ADD `paymentAccountId` int NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` ADD CONSTRAINT `FK_35001db438a20b0f1f9639ee7a1` FOREIGN KEY (`expenseOwnerSourceAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` ADD CONSTRAINT `FK_a0065898108cb8679ba49b02196` FOREIGN KEY (`paymentAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `shared_expense` ADD CONSTRAINT `FK_f975c3eedf20aff0e5e3e945120` FOREIGN KEY (`expenseOwnerDestinationAccountId`) REFERENCES `user_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense_user_agreement` DROP FOREIGN KEY `FK_a0065898108cb8679ba49b02196`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_ac29413be2d91abb43a98b0c543`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `shared_expense` DROP FOREIGN KEY `FK_35001db438a20b0f1f9639ee7a1`',
            undefined
        )
        await queryRunner.query('ALTER TABLE `shared_expense_user_agreement` DROP COLUMN `paymentAccountId`', undefined)
        await queryRunner.query('ALTER TABLE `shared_expense` DROP COLUMN `expenseOwnerSourceAccountId`', undefined)
    }
}
