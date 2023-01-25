import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Request } from 'express'
import { DwollaService } from '../../dwolla/dwolla.service'

@Injectable()
export class DwollaWebhookGuard implements CanActivate {
    private readonly logger = new Logger(DwollaWebhookGuard.name)

    constructor(private readonly dwollaService: DwollaService) {}

    /**
     * Validating webhook requests guide:
     * https://developers.dwolla.com/guides/webhooks/validating-webhooks#step-2-validating-webhooks
     *
     * @param context
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>()
        const secret = request.header('X-Request-Signature-SHA-256')
        const body = JSON.stringify(request.body)
        const subscription = await this.dwollaService.findWebhookSubscriptionMatchingSecret(secret, body)

        if (!subscription) {
            this.logger.warn(`Failed to match dwolla web hook subscription`)
            return false
        }

        // @ts-ignore
        request.dwollaWebhookSubscription = subscription

        return true
    }
}
