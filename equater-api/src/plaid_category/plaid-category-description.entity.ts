import { Exclude } from 'class-transformer'
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { PlaidCategoryHierarchy } from './plaid-category-hierarchy.entity'

@Entity()
export class PlaidCategoryDescription {
    constructor(properties: Partial<PlaidCategoryDescription> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @OneToMany((_) => PlaidCategoryHierarchy, (description) => description.description)
    @Exclude()
    hierarchy: Promise<PlaidCategoryHierarchy[]>

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Index({ unique: true })
    @Column()
    name: string
}
