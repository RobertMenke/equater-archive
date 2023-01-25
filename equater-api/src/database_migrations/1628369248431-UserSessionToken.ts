import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserSessionToken1628369248431 implements MigrationInterface {
    name = 'UserSessionToken1628369248431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user` ADD `sessionToken` text NULL DEFAULT NULL', undefined)
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `googlePlacesId` `googlePlacesId` varchar(255) NULL COMMENT 'If the user found the establishment with the places API we capture the ID here' DEFAULT NULL",
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `unique_vendor` CHANGE `googlePlacesId` `googlePlacesId` varchar(255) NULL COMMENT 'If the user found the establishment with the places API we capture the ID here'",
            undefined
        )
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `sessionToken`', undefined)
    }
}
