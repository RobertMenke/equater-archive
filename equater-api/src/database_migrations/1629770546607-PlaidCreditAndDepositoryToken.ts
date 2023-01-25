import { MigrationInterface, QueryRunner } from 'typeorm'

export class PlaidCreditAndDepositoryToken1629770546607 implements MigrationInterface {
    name = 'PlaidCreditAndDepositoryToken1629770546607'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `user` ADD `plaidLinkCreditAndDepositoryToken` text NULL COMMENT 'This token can be used for both credit and depository accounts. Importantly, only depository accounts can be used by a payee and all shared bills must have a depository account on file in order to deposit or withdraw funds.'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `user` ADD `dateTimePlaidLinkCreditAndDepositoryTokenExpires` datetime NULL',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `user` DROP COLUMN `dateTimePlaidLinkCreditAndDepositoryTokenExpires`',
            undefined
        )
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `plaidLinkCreditAndDepositoryToken`', undefined)
    }
}
