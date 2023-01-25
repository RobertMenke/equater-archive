import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { PlaidCategoryDescription } from './plaid-category-description.entity'
import { PlaidCategory } from './plaid-category.entity'

@Entity()
export class PlaidCategoryHierarchy {
    constructor(properties: Partial<PlaidCategoryHierarchy> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @ManyToOne((_) => PlaidCategory, (category) => category.hierarchy)
    @JoinColumn({ name: 'plaidCategoryId' })
    @Exclude()
    category: Promise<PlaidCategory>

    @Column()
    plaidCategoryId: number

    @ManyToOne((_) => PlaidCategoryDescription, (category) => category.hierarchy)
    @JoinColumn({ name: 'plaidCategoryHierarchyDescriptionId' })
    @Exclude()
    description: Promise<PlaidCategoryDescription>

    @Column()
    plaidCategoryHierarchyDescriptionId: number

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number
}
