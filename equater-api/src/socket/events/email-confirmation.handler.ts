import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { instanceToPlain } from 'class-transformer'
import { CommunicationGateway } from '../communication.gateway'
import { SocketEvent } from '../socket.event'
import { EmailConfirmationEvent } from './email-confirmation.event'

@EventsHandler(EmailConfirmationEvent)
export class EmailConfirmationHandler implements IEventHandler<EmailConfirmationEvent> {
    constructor(private readonly socketGateway: CommunicationGateway) {}

    handle(event: EmailConfirmationEvent) {
        this.socketGateway.sendMessage(
            event.user,
            SocketEvent.EMAIL_CONFIRMED,
            JSON.stringify(instanceToPlain(event.user, { excludePrefixes: ['__'] }))
        )
    }
}
