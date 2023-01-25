import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { CommunicationGateway } from '../communication.gateway'
import { UserSocketEvent } from './user-socket.event'

// This is a generic handler for any type of json serializable object that might be sent to a user
@EventsHandler(UserSocketEvent)
export class UserSocketEventHandler<T extends object> implements IEventHandler<UserSocketEvent<T>> {
    constructor(private readonly socketGateway: CommunicationGateway) {}

    handle(event: UserSocketEvent<T>) {
        this.socketGateway.sendMessage(event.user, event.event, JSON.stringify(event.payload))
    }
}
