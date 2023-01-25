import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { AuthService } from '../user/auth.service'
import { User } from '../user/user.entity'
import { SocketEvent } from './socket.event'

// Mocks the web socket gateway for tests
export class CommunicationGatewayFake implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly authService: AuthService) {}

    afterInit(server: Server): any {}

    async handleConnection(client: Socket, ...args: any[]) {}

    handleDisconnect(client: Socket): any {}

    sendMessage(user: User, event: SocketEvent, message: string) {}
}
