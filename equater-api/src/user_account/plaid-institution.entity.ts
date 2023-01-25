import { Exclude } from 'class-transformer'
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { UserAccount } from './user-account.entity'

@Entity()
export class PlaidInstitution {
    constructor(properties: Partial<PlaidInstitution> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////
    @OneToMany(() => UserAccount, (account) => account.plaidInstitution)
    @Exclude()
    userAccounts: Promise<UserAccount[]>

    ///////////////////
    // Fields
    ///////////////////
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'char', length: 36 })
    @Index({ unique: true })
    uuid: string

    @Column()
    institutionId: string

    @Column()
    name: string

    @Column({ nullable: true })
    websiteUrl: string

    @Column({ nullable: true })
    primaryColorHexCode: string

    @Column({ nullable: true })
    @Exclude()
    logoS3Key: string

    @Column({ nullable: true })
    @Exclude()
    logoS3Bucket: string

    @Column({
        nullable: true,
        type: 'char',
        length: 64,
        comment: 'Used for cache invalidation client-side'
    })
    logoSha256Hash: string = null

    @Column()
    usesOauthLoginFlow: boolean

    @Column()
    dateTimeCreated: Date = new Date()

    @Column({ nullable: true, type: 'datetime' })
    dateTimeUpdated: Date | null

    logoUrl: string | null
}
