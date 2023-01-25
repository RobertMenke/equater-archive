import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Put,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { NewsletterDto } from './newsletter.dto'
import { NewsletterService } from './newsletter.service'

@Controller('api/newsletter')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class NewsletterController {
    constructor(private readonly newsletterService: NewsletterService) {}

    @Put('email')
    async addNewsletterRecipient(@Body() dto: NewsletterDto) {
        const recipient = await this.newsletterService.findOne({
            email: dto.email
        })

        if (recipient) {
            return
        }

        return await this.newsletterService.addRecipient(dto.email)
    }
}
