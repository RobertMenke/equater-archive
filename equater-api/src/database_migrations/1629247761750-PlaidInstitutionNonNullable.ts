import { MigrationInterface, QueryRunner } from 'typeorm'

export class PlaidInstitutionNonNullable1629247761750 implements MigrationInterface {
    name = 'PlaidInstitutionNonNullable1629247761750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `user_account` DROP FOREIGN KEY `FK_806ace2287f0b6c6d62e014ae13`',
            undefined
        )
        await queryRunner.query(
            "ALTER TABLE `user_account` CHANGE `plaidInstitutionId` `plaidInstitutionId` int NOT NULL COMMENT 'This is the foreign key for our database table representing an institution and its metadata'",
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
        await queryRunner.query(
            "ALTER TABLE `user_account` CHANGE `plaidInstitutionId` `plaidInstitutionId` int NULL COMMENT 'This is the foreign key for our database table representing an institution and its metadata'",
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `user_account` ADD CONSTRAINT `FK_806ace2287f0b6c6d62e014ae13` FOREIGN KEY (`plaidInstitutionId`) REFERENCES `plaid_institution`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }
}
