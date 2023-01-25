import { Exclude } from 'class-transformer'
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { PlaidCategoryHierarchy } from './plaid-category-hierarchy.entity'

@Entity()
export class PlaidCategory {
    constructor(properties: Partial<PlaidCategory> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @OneToMany((_) => PlaidCategoryHierarchy, (description) => description.category)
    @Exclude()
    hierarchy: Promise<PlaidCategoryHierarchy[]>

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Index({ unique: true })
    @Column()
    categoryId: string

    @Column({ length: 25 })
    type: string
}
