import { MigrationInterface, QueryRunner } from 'typeorm'

export class PlaidInstitution1629235727754 implements MigrationInterface {
    name = 'PlaidInstitution1629235727754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `plaid_institution` (`id` int NOT NULL AUTO_INCREMENT, `uuid` char(36) NOT NULL, `institutionId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `websiteUrl` varchar(255) NULL, `primaryColorHexCode` varchar(255) NULL, `logoS3Key` varchar(255) NULL, `logoS3Bucket` varchar(255) NULL, `usesOauthLoginFlow` tinyint NOT NULL, `dateTimeCreated` datetime NOT NULL, `dateTimeUpdated` datetime NULL, UNIQUE INDEX `IDX_76ced7dc71e7156a8a3fa711da` (`uuid`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user_account` ADD `plaidInstitutionId` int NULL COMMENT 'This is the foreign key for our database table representing an institution and its metadata'",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `googlePlacesId` `googlePlacesId` varchar(255) NULL COMMENT 'If the user found the establishment with the places API we capture the ID here' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `user` CHANGE `sessionToken` `sessionToken` text NULL DEFAULT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `user_account` ADD CONSTRAINT `FK_806ace2287f0b6c6d62e014ae13` FOREIGN KEY (`plaidInstitutionId`) REFERENCES `plaid_institution`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `user_account` DROP FOREIGN KEY `FK_806ace2287f0b6c6d62e014ae13`',
            undefined
        )
        await queryRunner.query('ALTER TABLE `user` CHANGE `sessionToken` `sessionToken` text NULL', undefined)
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `googlePlacesId` `googlePlacesId` varchar(255) NULL COMMENT 'If the user found the establishment with the places API we capture the ID here'",
            undefined
        )
        await queryRunner.query('ALTER TABLE `user_account` DROP COLUMN `plaidInstitutionId`', undefined)
        await queryRunner.query('DROP INDEX `IDX_76ced7dc71e7156a8a3fa711da` ON `plaid_institution`', undefined)
        await queryRunner.query('DROP TABLE `plaid_institution`', undefined)
    }
}
