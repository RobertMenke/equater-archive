import { MigrationInterface, QueryRunner } from 'typeorm'

export class Sha256HashesForInstitutionLogo1639588748685 implements MigrationInterface {
    name = 'Sha256HashesForInstitutionLogo1639588748685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `coverPhotoUuid`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `profilePhotoUuid`', undefined)
        await queryRunner.query(
            "ALTER TABLE `plaid_institution` ADD `logoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `logoSha256Hash` `logoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `profilePhotoSha256Hash` `profilePhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `coverPhotoSha256Hash` `coverPhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `coverPhotoSha256Hash` `coverPhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `profilePhotoSha256Hash` `profilePhotoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `logoSha256Hash` `logoSha256Hash` char(64) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query('ALTER TABLE `plaid_institution` DROP COLUMN `logoSha256Hash`', undefined)
        await queryRunner.query(
            "ALTER TABLE `user` ADD `profilePhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` ADD `coverPhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side'",
            undefined
        )
    }
}
