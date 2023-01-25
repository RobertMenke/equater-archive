import { MigrationInterface, QueryRunner } from 'typeorm'

export class PlaidLinkTokensSeparateTable1640378006046 implements MigrationInterface {
    name = 'PlaidLinkTokensSeparateTable1640378006046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `plaid_link_token` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `userAccountId` int NULL COMMENT 'The userAccountId field will be populated only for tokens related to item updates', `tokenType` varchar(255) NOT NULL, `plaidLinkToken` text NOT NULL, `dateTimeTokenCreated` datetime NOT NULL, `dateTimeTokenExpires` datetime NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB",
            undefined
        )
        await queryRunner.query('ALTER TABLE `user_account` DROP COLUMN `plaidLinkToken`', undefined)
        await queryRunner.query('ALTER TABLE `user_account` DROP COLUMN `dateTimePlaidLinkTokenExpires`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `plaidLinkToken`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `dateTimePlaidLinkTokenExpires`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `plaidLinkCreditAndDepositoryToken`', undefined)
        await queryRunner.query(
            'ALTER TABLE `user` DROP COLUMN `dateTimePlaidLinkCreditAndDepositoryTokenExpires`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_link_token` ADD CONSTRAINT `FK_5d72f3e749d1b4214a5fde32797` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `plaid_link_token` DROP FOREIGN KEY `FK_5d72f3e749d1b4214a5fde32797`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `user` ADD `dateTimePlaidLinkCreditAndDepositoryTokenExpires` datetime NULL',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` ADD `plaidLinkCreditAndDepositoryToken` text NULL COMMENT 'This token can be used for both credit and depository accounts. Importantly, only depository accounts can be used by a payee and all shared bills must have a depository account on file in order to deposit or withdraw funds.'",
            undefined
        )
        await queryRunner.query('ALTER TABLE `user` ADD `dateTimePlaidLinkTokenExpires` datetime NULL', undefined)
        await queryRunner.query('ALTER TABLE `user` ADD `plaidLinkToken` text NULL', undefined)
        await queryRunner.query(
            'ALTER TABLE `user_account` ADD `dateTimePlaidLinkTokenExpires` datetime NULL',
            undefined
        )
        await queryRunner.query('ALTER TABLE `user_account` ADD `plaidLinkToken` text NULL', undefined)
        await queryRunner.query('DROP TABLE `plaid_link_token`', undefined)
    }
}
