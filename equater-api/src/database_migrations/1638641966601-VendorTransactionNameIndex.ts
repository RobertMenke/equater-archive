import { MigrationInterface, QueryRunner } from 'typeorm'

export class VendorTransactionNameIndex1638641966601 implements MigrationInterface {
    name = 'VendorTransactionNameIndex1638641966601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `profilePhotoUuid` `profilePhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user` CHANGE `coverPhotoUuid` `coverPhotoUuid` char(36) NULL COMMENT 'Used for cache invalidation client-side' DEFAULT NULL",
            undefined
        )
        await queryRunner.query(
            'CREATE INDEX `IDX_b2e9b23934a81391293366b4f6` ON `vendor_transaction_name` (`merchantName`)',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_b2e9b23934a81391293366b4f6` ON `vendor_transaction_name`', undefined)
        await queryRunner.query('ALTER TABLE `user` CHANGE `coverPhotoUuid` `coverPhotoUuid` char(36) NULL', undefined)
        await queryRunner.query(
            'ALTER TABLE `user` CHANGE `profilePhotoUuid` `profilePhotoUuid` char(36) NULL',
            undefined
        )
    }
}
