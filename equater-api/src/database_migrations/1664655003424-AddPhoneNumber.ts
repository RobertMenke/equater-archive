import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPhoneNumber1664655003424 implements MigrationInterface {
    name = 'AddPhoneNumber1664655003424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\``)
        await queryRunner.query(`DROP INDEX \`IDX_f0e1b4ecdca13b177e2e3a0613\` ON \`user\``)
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`phoneNumber\` char(20) NULL`)
        await queryRunner.query(`ALTER TABLE \`user_invite\` DROP FOREIGN KEY \`FK_9afce7b73bb5b42077fec68ed60\``)
        await queryRunner.query(
            `ALTER TABLE \`user_invite\` CHANGE \`initiatingUserId\` \`initiatingUserId\` int NOT NULL`
        )
        await queryRunner.query(
            `ALTER TABLE \`shared_expense\` CHANGE \`expenseOwnerDestinationAccountId\` \`expenseOwnerDestinationAccountId\` int NOT NULL COMMENT 'The account used to create deposits/withdrawals for payments. This account must be a depository account.'`
        )
        await queryRunner.query(
            `ALTER TABLE \`user_account\` CHANGE \`isActive\` \`isActive\` tinyint NOT NULL COMMENT 'Indicates whether or not the user has explicitly linked this account with Equater. If not, we do not want to match shared bills for this account since we have not been given explicit permission.' DEFAULT 0`
        )

        await queryRunner.query(`CREATE INDEX \`IDX_f2578043e491921209f5dadd08\` ON \`user\` (\`phoneNumber\`)`)
        await queryRunner.query(`CREATE INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\` (\`firstName\`)`)
        await queryRunner.query(`CREATE INDEX \`IDX_f0e1b4ecdca13b177e2e3a0613\` ON \`user\` (\`lastName\`)`)
        await queryRunner.query(
            `ALTER TABLE \`user_invite\` ADD CONSTRAINT \`FK_9afce7b73bb5b42077fec68ed60\` FOREIGN KEY (\`initiatingUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_invite\` DROP FOREIGN KEY \`FK_9afce7b73bb5b42077fec68ed60\``)
        await queryRunner.query(`DROP INDEX \`IDX_f0e1b4ecdca13b177e2e3a0613\` ON \`user\``)
        await queryRunner.query(`DROP INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\``)
        await queryRunner.query(`DROP INDEX \`IDX_f2578043e491921209f5dadd08\` ON \`user\``)
        await queryRunner.query(
            `ALTER TABLE \`user_account\` CHANGE \`isActive\` \`isActive\` tinyint NOT NULL DEFAULT '0'`
        )
        await queryRunner.query(
            `ALTER TABLE \`shared_expense\` CHANGE \`expenseOwnerDestinationAccountId\` \`expenseOwnerDestinationAccountId\` int NOT NULL`
        )
        await queryRunner.query(`ALTER TABLE \`user_invite\` CHANGE \`initiatingUserId\` \`initiatingUserId\` int NULL`)
        await queryRunner.query(
            `ALTER TABLE \`user_invite\` ADD CONSTRAINT \`FK_9afce7b73bb5b42077fec68ed60\` FOREIGN KEY (\`initiatingUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
        )
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`phoneNumber\``)
        await queryRunner.query(`CREATE INDEX \`IDX_f0e1b4ecdca13b177e2e3a0613\` ON \`user\` (\`lastName\`)`)
        await queryRunner.query(`CREATE INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\` (\`firstName\`)`)
    }
}
