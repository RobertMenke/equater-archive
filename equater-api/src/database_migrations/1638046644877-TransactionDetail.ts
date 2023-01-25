import { MigrationInterface, QueryRunner } from 'typeorm'

export class TransactionDetail1638046644877 implements MigrationInterface {
    name = 'TransactionDetail1638046644877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `transaction` ADD `transactionName` varchar(255) NULL', undefined)
        await queryRunner.query('ALTER TABLE `transaction` ADD `merchantName` varchar(255) NULL', undefined)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `transaction` DROP COLUMN `merchantName`', undefined)
        await queryRunner.query('ALTER TABLE `transaction` DROP COLUMN `transactionName`', undefined)
    }
}
