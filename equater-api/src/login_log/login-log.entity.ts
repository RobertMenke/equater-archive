import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../user/user.entity'

@Entity()
export class LoginLog {
    constructor(properties: Partial<LoginLog> = {}) {
        Object.assign(this, properties)
    }

    ///////////////////
    // Relationships
    ///////////////////

    @ManyToOne((_) => User, (user) => user.loginLogs)
    @JoinColumn()
    @Exclude()
    user: Promise<User>

    @Column({ nullable: false })
    userId: number

    ///////////////////
    // Fields
    ///////////////////

    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 40 })
    ipAddress: string

    //TODO: Capture this from auth token (low priority)
    @Column({ length: 100, nullable: true })
    sessionId: string = null

    @Column({ type: 'text', nullable: true })
    userAgent: string = null

    @Column()
    dateTimeAuthenticated: Date
}
