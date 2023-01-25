import { Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { logError, mapAsync } from '../../utils/data.utils'
import { RelationshipService } from '../relationship.service'
import { ConfirmRelationshipEvent } from './confirm-relationship.event'

@EventsHandler(ConfirmRelationshipEvent)
export class ConfirmRelationshipHandler implements IEventHandler<ConfirmRelationshipEvent> {
    private readonly logger = new Logger(ConfirmRelationshipHandler.name)

    constructor(private readonly relationshipService: RelationshipService) {}

    async handle(event: ConfirmRelationshipEvent) {
        try {
            await mapAsync(event.consentingUsers, (consentingUser) =>
                this.relationshipService.setRelationshipStatus(event.originatingUser, consentingUser, event.status)
            )
        } catch (e) {
            logError(this.logger, e)
        }
    }
}
