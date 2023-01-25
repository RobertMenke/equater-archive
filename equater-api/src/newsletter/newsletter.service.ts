import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { NewsletterRecipient } from './newsletter-recipient.entity'

@Injectable()
export class NewsletterService {
    constructor(@InjectRepository(NewsletterRecipient) private readonly repository: Repository<NewsletterRecipient>) {}

    findOne(conditions: FindOptionsWhere<NewsletterRecipient>): Promise<NewsletterRecipient | null> {
        return this.repository.findOne({
            where: conditions
        })
    }

    addRecipient(email: string): Promise<NewsletterRecipient> {
        const recipient = new NewsletterRecipient({
            email
        })

        return this.repository.save(recipient)
    }
}
