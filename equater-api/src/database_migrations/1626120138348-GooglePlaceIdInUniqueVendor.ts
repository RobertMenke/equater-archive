import { MigrationInterface, QueryRunner } from 'typeorm'

export class GooglePlaceIdInUniqueVendor1626120138348 implements MigrationInterface {
    name = 'GooglePlaceIdInUniqueVendor1626120138348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` ADD `googlePlacesId` varchar(255) NULL COMMENT 'If the user found the establishment with the places API we capture the ID here' DEFAULT NULL",
            undefined
        )
        await queryRunner.query('CREATE INDEX `IDX_58e4dbff0e1a32a9bdc861bb29` ON `user` (`firstName`)', undefined)
        await queryRunner.query('CREATE INDEX `IDX_f0e1b4ecdca13b177e2e3a0613` ON `user` (`lastName`)', undefined)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_f0e1b4ecdca13b177e2e3a0613` ON `user`', undefined)
        await queryRunner.query('DROP INDEX `IDX_58e4dbff0e1a32a9bdc861bb29` ON `user`', undefined)
        await queryRunner.query('ALTER TABLE `unique_vendor` DROP COLUMN `googlePlacesId`', undefined)
    }
}
