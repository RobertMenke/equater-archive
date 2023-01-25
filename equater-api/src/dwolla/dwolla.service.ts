import { HttpException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import { format } from 'date-fns'
import { Client as DwollaClient, Response } from 'dwolla-v2'
import { Repository } from 'typeorm'
import { PoorMansPagerDutyService } from '../alerting/poor-mans-pager-duty.service'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { USD } from '../config/constants'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { DwollaCustomerStatus, User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { logError, makeDinero, mapAsync, removeNullKeys } from '../utils/data.utils'
import { DwollaWebhookSubscription } from './dwolla-webhook-subscription.entity'
import { DWOLLA_WEBHOOK_ENDPOINT } from './dwolla-webhook.event'
import {
    Balance,
    DwollaBalanceResponse,
    DwollaCustomer,
    DwollaCustomerFundingSources,
    DwollaCustomerType,
    DwollaFundingSource,
    DwollaFundingSourceDto,
    DwollaTransfer,
    DwollaTransferRequestDto,
    DwollaTransferResponse,
    DwollaTransferStatus,
    VerifiedPersonalCustomerRequest
} from './dwolla.types'

/**
 * No TS definitions, so we'll have to make due with our own
 *
 * Creating a funding source for the master account
 * - https://docs.dwolla.com/#create-a-funding-source-for-an-account
 */
@Injectable()
export class DwollaService implements OnModuleInit {
    private readonly logger = new Logger(DwollaService.name)
    constructor(
        @Inject(Provider.DWOLLA_CLIENT)
        private readonly dwollaClient: DwollaClient,
        @InjectRepository(DwollaWebhookSubscription)
        private readonly dwollaSubscriptionRepository: Repository<DwollaWebhookSubscription>,
        private readonly configService: ConfigService,
        private readonly textingService: PoorMansPagerDutyService
    ) {}

    async onModuleInit() {
        try {
            const subscription = await this.createWebhookSubscriptionIfNotExists()
            this.logger.verbose(`Current dwolla subscription is ${subscription.uuid}`)
        } catch (e) {
            const alert = `FAILED TO CREATE OR FIND DWOLLA WEB HOOK SUBSCRIPTION. THIS NEEDS TO BE CORRECTED ASAP! ${e.message}`
            logError(this.logger, e)
            this.textingService.sendAlert(alert)
        }
    }

    /**
     * @see https://docs.dwolla.com/#retrieve-a-customer
     * @param user
     */
    async getCustomer(user: User): Promise<DwollaCustomer> {
        if (!user.dwollaCustomerUrl) {
            throw new HttpException(`User is not registered to send and receive funds`, HttpStatus.UNAUTHORIZED)
        }

        const response = await this.dwollaClient.get(user.dwollaCustomerUrl)

        return response.body as unknown as DwollaCustomer
    }

    /**
     * @see https://docs.dwolla.com/#retrieve-a-funding-source-balance
     * @param user
     */
    async getCustomerBalance(user: User): Promise<Balance[]> {
        if (!user.dwollaCustomerUrl) {
            throw new HttpException(`User is not registered to send and receive funds`, HttpStatus.UNAUTHORIZED)
        }

        const response = await this.dwollaClient.get(`${user.dwollaCustomerUrl}/funding-sources`)
        const body = response.body as DwollaCustomerFundingSources
        const sources = body._embedded['funding-sources'].filter((source) => source.type === 'balance')

        return await mapAsync(sources, async (source) => {
            const response = await this.dwollaClient.get(source._links.balance.href)
            const body = response.body as unknown as DwollaBalanceResponse
            const dinero = makeDinero(Number(body.balance.value.replace('.', '')))

            return {
                ...body.balance,
                dineroValueRepresentation: dinero.getAmount(),
                id: source.id,
                status: source.status,
                type: source.type,
                bankAccountType: source.bankAccountType,
                name: source.name,
                created: source.created,
                removed: source.removed,
                channels: source.channels,
                bankName: source.bankName,
                fingerprint: source.fingerprint
            }
        })
    }

    async createCustomer(user: User): Promise<Response> {
        if (user.dwollaCustomerUrl) {
            return await this.updateDwollaCustomer(user)
        }

        if (!user.firstName || !user.lastName) {
            throw new HttpException(
                'Unable to create a customer without a first and last name',
                HttpStatus.UNAUTHORIZED
            )
        }

        const requestBody = removeNullKeys(this.createDwollaCustomerDto(user))

        try {
            return await this.dwollaClient.post('customers', requestBody)
        } catch (err) {
            throw new HttpException(
                `Error saving customer credentials ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async updateDwollaCustomer(user: User): Promise<Response> {
        const requestBody = this.createDwollaCustomerDto(user)

        // If a customer is already verified we're not allowed to update ssn and DOB
        if (user.dwollaCustomerStatus === DwollaCustomerStatus.VERIFIED) {
            delete requestBody['ssn']
            delete requestBody['dateOfBirth']
            delete requestBody['lastName']
        }

        try {
            return await this.dwollaClient.post(`customers/${user.dwollaCustomerId}`, requestBody)
        } catch (err) {
            logError(this.logger, err)

            throw new HttpException(
                `Error saving customer credentials ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    /**
     * https://developers.dwolla.com/api-reference/customers/update#deactivate-a-customer
     *
     * @param user
     */
    async deactivateCustomer(user: User): Promise<Response> {
        try {
            return await this.dwollaClient.post(`customers/${user.dwollaCustomerId}`, {
                status: 'deactivated'
            })
        } catch (err) {
            logError(this.logger, err)

            throw new HttpException(
                `Error saving customer credentials ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    /**
     * @see https://docs.dwolla.com/#create-a-funding-source-for-a-customer
     * @param user
     * @param source
     */
    async createFundingSource(user: User, source: DwollaFundingSourceDto): Promise<Response> {
        try {
            return await this.dwollaClient.post(`${user.dwollaCustomerUrl}/funding-sources`, source)
        } catch (err) {
            throw new HttpException(`Error creating funding source ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getFundingSources(user: User): Promise<DwollaFundingSource[]> {
        const response = await this.dwollaClient.get(`${user.dwollaCustomerUrl}/funding-sources`)

        return response.body as unknown as DwollaFundingSource[]
    }

    /**
     * @see https://docs.dwolla.com/#retrieve-a-funding-source
     * @param account
     */
    async getFundingSource(account: UserAccount): Promise<DwollaFundingSource> {
        if (!account.dwollaFundingSourceUrl) {
            throw new HttpException(`User is not registered to send and receive funds`, HttpStatus.UNAUTHORIZED)
        }

        const response = await this.dwollaClient.get(account.dwollaFundingSourceUrl)

        return response.body as unknown as DwollaFundingSource
    }

    /**
     * @see https://developers.dwolla.com/api-reference/funding-sources/remove
     * @param account
     */
    async removeFundingSource(account: UserAccount) {
        if (!account.dwollaFundingSourceUrl) {
            this.logger.debug(`Attempted removing a funding source where none existed for UserAccount ${account.id}`)
            return
        }

        try {
            await this.dwollaClient.post(account.dwollaFundingSourceUrl, {
                removed: true
            })
        } catch (e) {
            logError(this.logger, e)
        }
    }

    /**
     * https://docs.dwolla.com/#initiate-a-transfer
     *
     * @param sourceUser
     * @param destinationUser
     * @param sourceAccount
     * @param destinationAccount
     * @param transaction
     */
    async createTransfer(
        sourceUser: User,
        destinationUser: User,
        sourceAccount: UserAccount,
        destinationAccount: UserAccount,
        transaction: SharedExpenseTransaction
    ): Promise<Response> {
        const transactionAmount = makeDinero(transaction.totalTransactionAmount)
        const feeAmount = makeDinero(transaction.totalFeeAmount)

        const request: DwollaTransferRequestDto = {
            _links: {
                source: {
                    href: sourceAccount.dwollaFundingSourceUrl
                },
                destination: {
                    href: destinationAccount.dwollaFundingSourceUrl
                }
            },
            amount: {
                currency: 'USD',
                value: transactionAmount.toFormat('$0,0.00')
            },
            // Currently, the fee can only be charged to 1 party
            fees: [
                {
                    _links: {
                        'charge-to': {
                            href: sourceUser.dwollaCustomerUrl
                        }
                    },
                    amount: {
                        value: feeAmount.toFormat('0,0.00'),
                        currency: 'USD'
                    }
                }
            ],
            clearing: {
                destination: 'next-available'
            },
            correlationId: transaction.uuid
        }

        if (feeAmount.getAmount() <= 0) {
            delete request['fees']
        }

        return await this.dwollaClient.post('transfers', request, {
            'Idempotency-Key': transaction.idempotencyToken
        })
    }

    async getTransfer(transfer: SharedExpenseTransaction): Promise<DwollaTransfer | null> {
        if (!transfer.dwollaTransferUrl) {
            return null
        }

        const response = await this.dwollaClient.get(transfer.dwollaTransferUrl)
        return response.body as unknown as DwollaTransfer
    }

    async getTransfers(user: User, byStatus?: DwollaTransferStatus): Promise<DwollaTransferResponse> {
        let endpoint = `${user.dwollaCustomerUrl}/transfers`

        if (byStatus) {
            endpoint += `?status=${byStatus}`
        }

        const response = await this.dwollaClient.get(endpoint)

        return response.body as unknown as DwollaTransferResponse
    }

    /**
     * @see https://developers.dwolla.com/api-reference/transfers/cancel
     * @param transfer
     */
    async cancelTransfer(transfer: SharedExpenseTransaction): Promise<void> {
        if (!transfer.dwollaTransferUrl) {
            return null
        }

        await this.dwollaClient.post(transfer.dwollaTransferUrl, {
            status: 'cancelled'
        })
    }

    /**
     * Applications must register at least one subscription with Dwolla for various events
     * the application can create up to 10 for redundancy.
     *
     * Any request to Dwolla should validate that the secret provided matches the one
     * generated here.
     *
     * @link https://developers.dwolla.com/guides/webhooks/create-subscription#step-1-create-a-webhook-subscription
     * @link https://developers.dwolla.com/concepts/webhook-events#webhook-events
     */
    async createWebhookSubscriptionIfNotExists() {
        const subscription = await this.dwollaSubscriptionRepository.findOne({
            where: {
                isActive: true
            }
        })

        if (subscription) {
            return subscription
        }

        const secret: Buffer = randomBytes(32)
        const secretString = secret.toString('hex')
        const subscriptionUrl = await this.createWebhookSubscription(secretString)
        const subscriptionUuid = subscriptionUrl.split('/').pop()

        return await this.dwollaSubscriptionRepository.save(
            new DwollaWebhookSubscription({
                uuid: subscriptionUuid,
                secret: secretString,
                dwollaSubscriptionUrl: subscriptionUrl,
                isActive: true
            })
        )
    }

    /**
     * Dwolla signs each webhook request with the secret you passed in when you created the webhook subscription.
     *
     * https://developers.dwolla.com/guides/webhooks/validating-webhooks#step-2-validating-webhooks
     * @param secret
     * @param payloadBody
     */
    async findWebhookSubscriptionMatchingSecret(
        secret: string,
        payloadBody: string
    ): Promise<DwollaWebhookSubscription | null> {
        const activeSubscriptions = await this.dwollaSubscriptionRepository.find({
            where: {
                isActive: true
            }
        })

        return activeSubscriptions.find((subscription) => {
            const hash = createHmac('sha256', subscription.secret).update(payloadBody).digest('hex')

            return timingSafeEqual(Buffer.from(secret), Buffer.from(hash))
        })
    }

    /**
     * Return value is the url of the subscription.
     *
     * ex: https://api-sandbox.dwolla.com/webhook-subscriptions/5af4c10a-f6de-4ac8-840d-42cb65454216
     *
     * @link https://developers.dwolla.com/guides/webhooks/create-subscription#step-1-create-a-webhook-subscription
     * @param secret
     * @private
     */
    private async createWebhookSubscription(secret: string): Promise<string> {
        const response = await this.dwollaClient.post('webhook-subscriptions', {
            url: `${this.configService.get(Environment.API_BASE)}/${DWOLLA_WEBHOOK_ENDPOINT}`,
            secret: secret
        })

        return response.headers.get('location')
    }

    private createDwollaCustomerDto(user: User): VerifiedPersonalCustomerRequest {
        return {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            // If this is defined in the request Dwolla requires all verified customer fields to be sent
            type: user.lastFourOfSsn ? DwollaCustomerType.PERSONAL : undefined,
            address1: user.addressOne,
            address2: user.addressTwo || undefined,
            city: user.city,
            state: user.state,
            postalCode: user.postalCode,
            dateOfBirth: user.dateOfBirth ? format(user.dateOfBirth, 'yyyy-MM-dd') : null,
            ssn: user.lastFourOfSsn,
            correlationId: user.uuid
        }
    }
}
