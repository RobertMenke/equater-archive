import { Exclude } from 'class-transformer'
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { Transaction } from './transaction.entity'
import { v4 as uuid } from 'uuid'
import { UniqueVendorAssociation } from './unique-vendor-association.entity'
import { VendorTransactionName } from './vendor-transaction-name.entity'

// This table formalizes the list of vendors that we allow users to search by and set up
// recurring payments with. Any time we come across an unfamiliar transaction it will land
// here and need to be manually reviewed by a member of our team so that we can put together
// a well-formatted and palatable list for customers
@Entity()
export class UniqueVendor {
    constructor(properties: Partial<UniqueVendor> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @OneToMany(() => Transaction, (transaction) => transaction.uniqueVendor)
    @Exclude()
    transactions: Promise<Transaction[]>

    @OneToMany(() => SharedExpense, (sharedExpense) => sharedExpense.uniqueVendor)
    @Exclude()
    sharedExpenses: Promise<SharedExpense[]>

    @OneToMany(() => VendorTransactionName, (name) => name.uniqueVendor)
    @Exclude()
    vendorNames: Promise<VendorTransactionName[]>

    // A unique vendor association helps cover the case that a user
    // wants to split their apartment, like "Icon Central", but the biller
    // is actually "TRG Management Group"
    @OneToMany(() => UniqueVendorAssociation, (association) => association.uniqueVendor)
    @Exclude()
    uniqueVendorAssociations: UniqueVendorAssociation[]

    @OneToMany(() => UniqueVendorAssociation, (association) => association.associatedUniqueVendor)
    @Exclude()
    associatedUniqueVendors: UniqueVendorAssociation[]

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string = uuid()

    @Column({
        nullable: false,
        comment:
            'If we have to normalize the vendor name as part of an operational process we will assign a friendly name so that users do not have to deal with confusing merchant transaction names'
    })
    @Index({ unique: true })
    friendlyName: string

    @Column({
        nullable: true,
        comment: 'ACH PPD_ID for the merchant'
    })
    @Index({ unique: true })
    ppdId: string = null

    @Column({ nullable: false })
    dateTimeAdded: Date = new Date()

    @Column({ nullable: true })
    dateTimeModified: Date = null

    @Column({ nullable: false, default: 0 })
    totalNumberOfExpenseSharingAgreements: number = 0

    @Column({ nullable: true, type: 'varchar', length: 255 })
    logoS3Bucket: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    logoS3Key: string | null

    @Column({ nullable: false, default: false })
    logoUploadCompleted: boolean = false

    @Column({
        nullable: true,
        type: 'char',
        length: 64,
        comment: 'Used for cache invalidation client-side'
    })
    logoSha256Hash: string = null

    @Column({
        nullable: false,
        default: false,
        comment:
            'Indicates whether or not a member of our staff has reviewed this vendor name to ensure users have a good experience'
    })
    hasBeenReviewedInternally: boolean = false

    @Column({
        nullable: false,
        default: false,
        comment:
            'Some transactions will come in with names like “Interest Payment” with no PPD ID. There’s no way we can actually identify where this is coming from and therefore want to filter these out of our system.'
    })
    vendorIdentityCannotBeDetermined: boolean = false

    @Column({
        nullable: true,
        comment: 'If the user found the establishment with the places API we capture the ID here',
        type: 'varchar',
        length: 255
    })
    googlePlacesId: string | null

    logoUrl: string = null
}
