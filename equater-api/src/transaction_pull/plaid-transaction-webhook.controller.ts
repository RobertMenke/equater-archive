import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Logger,
    Param,
    Post,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { instanceToPlain } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { TransactionsUpdateEvent } from '../expense_api/events/transactions-update.event'
import { PlaidError, PlaidService } from '../plaid/plaid.service'
import { UserIdDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { PlaidAuthenticationErrorEvent } from '../user_account/events/plaid-authentication-error.event'
import { UserAccountService } from '../user_account/user-account.service'
import { mapAsync } from '../utils/data.utils'
import { TransactionPullService } from './transaction-pull.service'

export enum WebhookCodes {
    INITIAL_UPDATE = 'INITIAL_UPDATE',
    HISTORICAL_UPDATE = 'HISTORICAL_UPDATE',
    DEFAULT_UPDATE = 'DEFAULT_UPDATE',
    TRANSACTIONS_REMOVED = 'TRANSACTIONS_REMOVED',
    ERROR = 'ERROR',
    PENDING_EXPIRATION = 'PENDING_EXPIRATION'
}

export class PlaidWebhookDto {
    @IsString()
    @IsNotEmpty()
    item_id: string

    @IsString()
    webhook_type: string

    //only present if webhook is a transaction hook
    new_transactions: number

    //This may actual be present for all webhooks
    //TBD after further research
    webhook_code: WebhookCodes

    error: PlaidError
}

@Controller('plaid')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class PlaidTransactionWebhookController {
    private readonly logger = new Logger(PlaidTransactionWebhookController.name)
    constructor(
        private readonly userService: UserService,
        private readonly accountService: UserAccountService,
        private readonly plaidService: PlaidService,
        private readonly importService: TransactionPullService,
        private readonly eventBus: EventBus
    ) {}

    /**
     * Objectives:
     *
     * - on new transactions (DEFAULT_UPDATE) pull transactions since the last known
     *   transaction and if necessary, update expense sharing agreements
     * - On initial or historical updates, pull in transaction history for record keeping
     *
     * @param dto
     * @param body
     */
    @Post('webhook/:userId')
    async webhook(@Param() dto: UserIdDto, @Body() body: PlaidWebhookDto) {
        this.logger.log(
            'Plaid Web Hook Received',
            `DTO: ${JSON.stringify(instanceToPlain(dto, { excludePrefixes: ['__'] }))}`
        )
        this.logger.log(
            'Plaid Web Hook Request Body',
            JSON.stringify(instanceToPlain(body, { excludePrefixes: ['__'] }))
        )
        const user = await this.userService.findOneWhere({ id: dto.userId })
        if (!user) {
            return
        }

        switch (body.webhook_code) {
            case WebhookCodes.DEFAULT_UPDATE:
                this.logger.verbose(`Parsing new transactions for ${user.id}`)
                await this.fetchNewTransactions(user)
                break
            case WebhookCodes.INITIAL_UPDATE:
            case WebhookCodes.HISTORICAL_UPDATE:
                this.logger.log(body.webhook_code)
                if (user) {
                    this.importService.parseHistoricalTransactionPull(user).catch((e) => this.logger.log(e))
                }
                break
            case WebhookCodes.ERROR:
                if (body.error && this.plaidService.getReAuthenticationErrorCodes().includes(body.error.error_code)) {
                    await this.requireBankLogin(body)
                }
                break
            // https://plaid.com/docs/link/oauth/#refreshing-item-consent
            // To determine when a user will need to re-authenticate, make a request to the /item/get endpoint and note the consent_expiration_time field.
            // Plaid will also send a PENDING_EXPIRATION webhook one week before a user’s access-consent is set to expire. In order to continue receiving data
            // for that user, ensure they re-authenticate via update mode prior to that date. When using Link in update mode, be sure to specify your redirect URI
            // via the redirect_uri field as described in Configure your Link token with your redirect URI.
            case WebhookCodes.PENDING_EXPIRATION:
                await this.requireBankLogin(body)
                break
            default:
                this.logger.log(`No matching case for plaid webhook ${body.webhook_code}`)
                break
        }
    }

    private async requireBankLogin(dto: PlaidWebhookDto) {
        const accounts = await this.accountService.findWhere({
            plaidItemId: dto.item_id,
            isActive: true
        })

        if (accounts.length === 0) {
            return
        }

        accounts.forEach((account) => {
            this.eventBus.publish(new PlaidAuthenticationErrorEvent(dto.error, account))
        })
    }

    private async fetchNewTransactions(user: User) {
        const accounts = await this.accountService.findAllActive(user)

        if (accounts.length === 0) {
            return
        }

        await mapAsync(accounts, async (account) => {
            const transactionsResponse = await this.plaidService.getTransactionHistory(
                account,
                account.dateOfLastPlaidTransactionPull
            )
            const transactions = await this.importService.storeTransactions(user, account, transactionsResponse)
            if (transactions.length > 0) {
                this.eventBus.publish(new TransactionsUpdateEvent(user, account, transactions))
            }
        })
    }
}
