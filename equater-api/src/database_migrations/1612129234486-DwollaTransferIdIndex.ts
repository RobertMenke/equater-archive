import { MigrationInterface, QueryRunner } from 'typeorm'

export class DwollaTransferIdIndex1612129234486 implements MigrationInterface {
    name = 'DwollaTransferIdIndex1612129234486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `shared_expense_transaction` ADD UNIQUE INDEX `IDX_9dbc2c2b2105fb1b5072852860` (`dwollaTransferId`)'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `shared_expense_transaction` DROP INDEX `IDX_9dbc2c2b2105fb1b5072852860`')
    }
}
