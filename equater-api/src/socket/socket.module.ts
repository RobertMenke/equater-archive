import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { CommunicationGateway } from './communication.gateway'
import { AgreementUpdateHandler } from './events/agreement-update.handler'
import { EmailConfirmationHandler } from './events/email-confirmation.handler'
import { TransactionUpdateHandler } from './events/transaction-update.handler'
import { UserSocketEventHandler } from './events/user-socket-event.handler'

@Module({
    imports: [UserModule],
    providers: [
        CommunicationGateway,
        EmailConfirmationHandler,
        AgreementUpdateHandler,
        TransactionUpdateHandler,
        UserSocketEventHandler
    ],
    exports: [CommunicationGateway]
})
export class SocketModule {}
