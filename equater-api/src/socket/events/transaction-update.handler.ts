import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { CommunicationGateway } from '../communication.gateway'
import { SocketEvent } from '../socket.event'
import { TransactionUpdateEvent } from './transaction-update.event'

@EventsHandler(TransactionUpdateEvent)
export class TransactionUpdateHandler implements IEventHandler<TransactionUpdateEvent> {
    constructor(private readonly socketGateway: CommunicationGateway) {}

    handle(event: TransactionUpdateEvent) {
        event.relevantUsers.forEach((user) => {
            this.socketGateway.sendMessage(
                user,
                SocketEvent.TRANSACTION_UPDATED,
                JSON.stringify(event.serializedTransactionStory)
            )
        })
    }
}
