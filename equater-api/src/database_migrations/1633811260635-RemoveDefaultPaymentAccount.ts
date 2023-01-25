import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveDefaultPaymentAccount1633811260635 implements MigrationInterface {
    name = 'RemoveDefaultPaymentAccount1633811260635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `user_account` DROP COLUMN `isDefaultUsedForPayment`', undefined)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `user_account` ADD `isDefaultUsedForPayment` tinyint NOT NULL COMMENT 'Designates whether or not this card will be used to pay others (decided upon when accepting an expense agreement)' DEFAULT '0'",
            undefined
        )
    }
}
