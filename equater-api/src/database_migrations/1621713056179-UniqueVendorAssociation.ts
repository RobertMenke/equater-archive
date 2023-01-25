import { MigrationInterface, QueryRunner } from 'typeorm'

export class UniqueVendorAssociation1621713056179 implements MigrationInterface {
    name = 'UniqueVendorAssociation1621713056179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `unique_vendor_association` (`uniqueVendorId` int NOT NULL, `associatedUniqueVendorId` int NOT NULL, `id` int NOT NULL AUTO_INCREMENT, `associationType` varchar(255) NOT NULL, `notes` text NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `unique_vendor_association` ADD CONSTRAINT `FK_16b3ef1478581b61652a41e5901` FOREIGN KEY (`uniqueVendorId`) REFERENCES `unique_vendor`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `unique_vendor_association` ADD CONSTRAINT `FK_a30e8aebdc0801e51cd9107b500` FOREIGN KEY (`associatedUniqueVendorId`) REFERENCES `unique_vendor`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `unique_vendor_association` DROP FOREIGN KEY `FK_a30e8aebdc0801e51cd9107b500`',
            undefined
        )
        await queryRunner.query(
            'ALTER TABLE `unique_vendor_association` DROP FOREIGN KEY `FK_16b3ef1478581b61652a41e5901`',
            undefined
        )
        await queryRunner.query('DROP TABLE `unique_vendor_association`', undefined)
    }
}
