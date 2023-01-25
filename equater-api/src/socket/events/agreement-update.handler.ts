import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { CommunicationGateway } from '../communication.gateway'
import { SocketEvent } from '../socket.event'
import { AgreementUpdateEvent } from './agreement-update.event'

@EventsHandler(AgreementUpdateEvent)
export class AgreementUpdateHandler implements IEventHandler<AgreementUpdateEvent> {
    constructor(private readonly socketGateway: CommunicationGateway) {}

    handle(event: AgreementUpdateEvent) {
        event.relevantUsers.forEach((user) => {
            this.socketGateway.sendMessage(user, SocketEvent.AGREEMENT_UPDATED, JSON.stringify(event.serializedStory))
        })
    }
}
