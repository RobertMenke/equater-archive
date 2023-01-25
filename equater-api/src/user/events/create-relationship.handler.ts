import { Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { logError } from '../../utils/data.utils'
import { CreateRelationshipEvent } from './create-relationship.event'
import { RelationshipService } from '../relationship.service'

@EventsHandler(CreateRelationshipEvent)
export class CreateRelationshipHandler implements IEventHandler<CreateRelationshipEvent> {
    private readonly logger = new Logger(CreateRelationshipHandler.name)

    constructor(private readonly relationshipService: RelationshipService) {}

    handle(event: CreateRelationshipEvent) {
        this.relationshipService
            .createRelationships(event.originatingUser, event.consentingUsers)
            .catch((err) => logError(this.logger, err))
    }
}
