import { DwollaWebhookEvent } from './dwolla-webhook.event'

export interface DwollaWebhookPayload {
    id: string
    resourceId: string
    topic: DwollaWebhookEvent
    _links: {
        self: DwollaWebhookPayloadLink
        account: DwollaWebhookPayloadLink
        resource: DwollaWebhookPayloadLink
        customer: DwollaWebhookPayloadLink
    }
    created: string
}

export interface DwollaWebhookPayloadLink {
    href: string
    'resource-type': string
    type: string
}
