import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixDeviceRegistrationEdgeCase1614044288381 implements MigrationInterface {
    name = 'FixDeviceRegistrationEdgeCase1614044288381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_034f6dc930c25b5d315462ca9b` ON `user_device`', undefined)
        await queryRunner.query(
            'CREATE INDEX `IDX_034f6dc930c25b5d315462ca9b` ON `user_device` (`fcmToken`)',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_034f6dc930c25b5d315462ca9b` ON `user_device`', undefined)
        await queryRunner.query(
            'CREATE UNIQUE INDEX `IDX_034f6dc930c25b5d315462ca9b` ON `user_device` (`fcmToken`)',
            undefined
        )
    }
}
