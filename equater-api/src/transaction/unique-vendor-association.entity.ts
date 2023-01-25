import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UniqueVendor } from './unique-vendor.entity'

// A unique vendor association helps cover the case that a user
// wants to split their apartment, like "Icon Central", but the biller
// is actually "TRG Management Group"
@Entity()
export class UniqueVendorAssociation {
    constructor(props: Partial<UniqueVendorAssociation> = {}) {
        Object.assign(this, props)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => UniqueVendor, (vendor) => vendor.uniqueVendorAssociations)
    @JoinColumn({ name: 'uniqueVendorId' })
    uniqueVendor: Promise<UniqueVendor>

    @Column()
    uniqueVendorId: number

    @ManyToOne(() => UniqueVendor, (vendor) => vendor.associatedUniqueVendors)
    @JoinColumn({ name: 'associatedUniqueVendorId' })
    associatedUniqueVendor: Promise<UniqueVendor>

    @Column()
    associatedUniqueVendorId: number

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    associationType: UniqueVendorAssociationType

    @Column({ nullable: true, type: 'text' })
    notes: string = null
}

export enum UniqueVendorAssociationType {
    OTHER = 'OTHER',
    PARENT_COMPANY = 'PARENT_COMPANY',
    SUBSIDIARY_COMPANY = 'SUBSIDIARY_COMPANY'
}
