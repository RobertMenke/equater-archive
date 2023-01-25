import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NewsletterRecipient } from './newsletter-recipient.entity'
import { NewsletterController } from './newsletter.controller'
import { NewsletterService } from './newsletter.service'

@Module({
    imports: [TypeOrmModule.forFeature([NewsletterRecipient])],
    controllers: [NewsletterController],
    providers: [NewsletterService]
})
export class NewsletterModule {}
