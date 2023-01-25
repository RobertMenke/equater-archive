import { Inject, Injectable, Logger } from '@nestjs/common'
// @ts-ignore
import { MessageInstance, Twilio } from 'twilio'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { logError } from '../utils/data.utils'

@Injectable()
export class PoorMansPagerDutyService {
    private recipients = []
    private readonly logger = new Logger(PoorMansPagerDutyService.name)

    constructor(
        @Inject(Provider.TWILIO_CLIENT) private readonly twilioClient: Twilio,
        private readonly configService: ConfigService
    ) {}

    /**
     * Fire & forget. No need to disrupt or slow down the application on notification errors.
     *
     * @param message
     */
    sendAlert(message: string) {
        for (const recipient of this.recipients) {
            this.sendNotification(recipient, message).catch((e) => {
                logError(this.logger, e)
                this.logger.error(e.message)
            })
        }
    }

    private sendNotification(number: string, message: string): Promise<MessageInstance> {
        return this.twilioClient.messages.create({
            from: this.configService.get(Environment.TWILIO_ALERT_FROM_NUMBER),
            to: number,
            body: message
        })
    }
}
