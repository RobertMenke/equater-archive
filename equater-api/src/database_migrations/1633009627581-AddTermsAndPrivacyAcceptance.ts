import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTermsAndPrivacyAcceptance1633009627581 implements MigrationInterface {
    name = 'AddTermsAndPrivacyAcceptance1633009627581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user` ADD `acceptedTermsOfService` tinyint NOT NULL DEFAULT 0', undefined)
        await queryRunner.query('ALTER TABLE `user` ADD `acceptedPrivacyPolicy` tinyint NOT NULL DEFAULT 0', undefined)
        await queryRunner.query('ALTER TABLE `login_log` CHANGE `userAgent` `userAgent` text NULL', undefined)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `login_log` CHANGE `userAgent` `userAgent` text NOT NULL', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `acceptedPrivacyPolicy`', undefined)
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `acceptedTermsOfService`', undefined)
    }
}
