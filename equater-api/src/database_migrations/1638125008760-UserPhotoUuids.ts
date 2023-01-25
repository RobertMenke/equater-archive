import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserPhotoUuids1638125008760 implements MigrationInterface {
    name = 'UserPhotoUuids1638125008760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user` ADD `profilePhotoUuid` char(36) NULL DEFAULT NULL', undefined)
        await queryRunner.query('ALTER TABLE `user` ADD `coverPhotoUuid` char(36) NULL DEFAULT NULL', undefined)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `coverPhotoUuid`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `profilePhotoUuid`', undefined)
    }
}
