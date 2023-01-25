import { ClassSerializerInterceptor, Logger, UseInterceptors } from '@nestjs/common'
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { AuthService } from '../user/auth.service'
import { User } from '../user/user.entity'
import { logError } from '../utils/data.utils'
import { SocketEvent } from './socket.event'

// The iOS client requires a connection over V3
// https://github.com/socketio/socket.io-client-swift/blob/master/Usage%20Docs/Compatibility.md
@WebSocketGateway({
    transports: ['websocket'],
    allowEIO3: true
})
@UseInterceptors(ClassSerializerInterceptor)
export class CommunicationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server

    private logger = new Logger(CommunicationGateway.name)

    constructor(private readonly authService: AuthService) {}

    afterInit(_: Server): any {
        this.logger.log('Socket server initialized')
    }

    async handleConnection(client: Socket) {
        try {
            const user = await this.findUserFromConnectionToken(client)
            client.join(user.uuid)
        } catch (e) {
            logError(this.logger, e)
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            const user = await this.findUserFromConnectionToken(client)
            client.leave(user.uuid)
        } catch (e) {
            logError(this.logger, e)
        }
    }

    sendMessage(user: User, event: SocketEvent, message: string) {
        this.server.to(user.uuid).emit(event, message)
    }

    private findUserFromConnectionToken(client: Socket): Promise<User> {
        const token = client.handshake.query.token as string

        return this.authService.findUserFromAuthToken(token)
    }
}
