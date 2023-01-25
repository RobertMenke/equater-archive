import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { encryptionTransformer } from '../utils/database.utils'
import { User } from '../user/user.entity'
import { PlaidTokenType } from './plaid-token-type'

@Entity()
export class PlaidLinkToken {
    constructor(properties: Partial<PlaidLinkToken> = {}) {
        Object.assign(this, properties)
    }

    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne((_) => User, (user) => user.plaidLinkTokens)
    @JoinColumn()
    @Exclude()
    user: Promise<User>

    @Column({ nullable: false })
    userId: number

    @Column({
        nullable: true,
        comment: 'The userAccountId field will be populated only for tokens related to item updates',
        type: 'int'
    })
    userAccountId: number | null

    @Column({ nullable: false, type: 'varchar', length: 255 })
    tokenType: PlaidTokenType

    @Column({ nullable: false, transformer: encryptionTransformer, type: 'text' })
    plaidLinkToken: string

    @Column({ nullable: false })
    dateTimeTokenCreated: Date = new Date()

    @Column({ nullable: false })
    dateTimeTokenExpires: Date
}
