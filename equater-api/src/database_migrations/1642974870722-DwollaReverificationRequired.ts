import { MigrationInterface, QueryRunner } from 'typeorm'

export class DwollaReverificationRequired1642974870722 implements MigrationInterface {
    name = 'DwollaReverificationRequired1642974870722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`dwollaReverificationNeeded\` tinyint NOT NULL DEFAULT 0`)
        await queryRunner.query(
            `ALTER TABLE \`user_device\` CHANGE \`fcmToken\` \`fcmToken\` varchar(255) NULL COMMENT 'We want to allow the same device to be registered to multiple users, but we will need to make sure to filter duplicates when sending notification'`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_device\` CHANGE \`fcmToken\` \`fcmToken\` varchar(255) NULL`)
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`dwollaReverificationNeeded\``)
    }
}
