import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class NewsletterRecipient {
    constructor(properties: Partial<NewsletterRecipient> = {}) {
        Object.assign(this, properties)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Index({ unique: true })
    email: string
}
