import { Exclude } from 'class-transformer'
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UniqueVendor } from './unique-vendor.entity'

// The idea behind this table is that when transactions come in that we haven't reviewed
// and associated with a unique vendor they'll be stored here for review and future matches.
// By future matches I mean that if a transaction comes in without a ppd id but matches
// on the vendor name we'll be able to look in this table to find out which unique vendor
// this is associated with. One unique vendor can have many vendor transaction names, so
// it's important that we be able to match on various transaction names for a particular vendor
@Entity()
export class VendorTransactionName {
    constructor(props: Partial<VendorTransactionName> = {}) {
        Object.assign(this, props)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => UniqueVendor, (vendor) => vendor.vendorNames)
    @JoinColumn()
    @Exclude()
    uniqueVendor: Promise<UniqueVendor>

    @Column()
    uniqueVendorId: number

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    @Index({ unique: true })
    transactionName: string

    @Column({ nullable: true })
    @Index({ unique: false })
    merchantName: string

    @Column({ nullable: true })
    ppdId: string

    @Column({ nullable: false })
    dateTimeCreated: Date = new Date()
}
