import { Injectable } from '@nestjs/common'

@Injectable()
export class PoorMansPagerDutyServiceFake {
    sendAlert(message: string) {
        // no action needed
    }
}
