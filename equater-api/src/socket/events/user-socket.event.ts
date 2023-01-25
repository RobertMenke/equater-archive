import { User } from '../../user/user.entity'
import { SocketEvent } from '../socket.event'

/**
 * @see CommunicationGateway.sendMessage
 */
export class UserSocketEvent<T extends object> {
    constructor(public readonly user: User, public readonly event: SocketEvent, public readonly payload: T) {}
}
