import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixLatAndLongTypes1664834134873 implements MigrationInterface {
    name = 'FixLatAndLongTypes1664834134873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`latitude\``)
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`latitude\` decimal(6,2) NULL`)
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`longitude\``)
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`longitude\` decimal(6,2) NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`longitude\``)
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`longitude\` int NULL`)
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`latitude\``)
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`latitude\` int NULL`)
    }
}
