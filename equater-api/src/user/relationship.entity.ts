import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './user.entity'

@Entity()
export class Relationship {
    constructor(options: Partial<Relationship> = {}) {
        Object.assign(this, options)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @ManyToOne(() => User, (user) => user.originatingUserRelationships)
    @JoinColumn()
    @Exclude()
    originatingUser: User

    @Column({ nullable: false })
    originatingUserId: number

    @ManyToOne(() => User, (user) => user.consentingUserRelationships)
    @JoinColumn()
    @Exclude()
    consentingUser: User

    @Column({ nullable: false })
    consentingUserId: number

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, default: false })
    isConfirmed: boolean = false

    @Column({ nullable: false })
    dateTimeCreated: Date = new Date()

    @Column({ nullable: true })
    dateTimeConfirmed: Date
}
