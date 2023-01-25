import { MigrationInterface, QueryRunner } from 'typeorm'

export class Sha256HashesForImages1639578306109 implements MigrationInterface {
    name = 'Sha256HashesForImages1639578306109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` ADD `logoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` ADD `profilePhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` ADD `coverPhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `profilePhotoUuid` `profilePhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `coverPhotoUuid` `coverPhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_ded3a65cf116fb0e45679498dab`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_79fb0656c6fbb66ed66db63229b`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` CHANGE `plaidCategoryId` `plaidCategoryId` int NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` CHANGE `plaidCategoryHierarchyDescriptionId` `plaidCategoryHierarchyDescriptionId` int NOT NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_ded3a65cf116fb0e45679498dab` FOREIGN KEY (`plaidCategoryId`) REFERENCES `plaid_category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_79fb0656c6fbb66ed66db63229b` FOREIGN KEY (`plaidCategoryHierarchyDescriptionId`) REFERENCES `plaid_category_description`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_79fb0656c6fbb66ed66db63229b`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` DROP FOREIGN KEY `FK_ded3a65cf116fb0e45679498dab`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` CHANGE `plaidCategoryHierarchyDescriptionId` `plaidCategoryHierarchyDescriptionId` int NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` CHANGE `plaidCategoryId` `plaidCategoryId` int NULL',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_79fb0656c6fbb66ed66db63229b` FOREIGN KEY (`plaidCategoryHierarchyDescriptionId`, `plaidCategoryHierarchyDescriptionId`, `plaidCategoryHierarchyDescriptionId`) REFERENCES `plaid_category_description`(`id`,`id`,`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `plaid_category_hierarchy` ADD CONSTRAINT `FK_ded3a65cf116fb0e45679498dab` FOREIGN KEY (`plaidCategoryId`, `plaidCategoryId`, `plaidCategoryId`) REFERENCES `plaid_category`(`id`,`id`,`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `coverPhotoUuid` `coverPhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `profilePhotoUuid` `profilePhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `coverPhotoSha256Hash`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `profilePhotoSha256Hash`', undefined)
        await queryRunner.query('ALTER TABLE `unique_vendor` DROP COLUMN `logoSha256Hash`', undefined)
    }
}
