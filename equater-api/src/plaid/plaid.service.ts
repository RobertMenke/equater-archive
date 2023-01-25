import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { AxiosError } from 'axios'
import { format, subDays } from 'date-fns'
import * as Dinero from 'dinero.js'
import {
    AccountBase,
    AccountsGetResponse,
    AccountSubtype,
    AuthGetResponse,
    CategoriesGetResponse,
    CountryCode,
    Institution,
    ItemPublicTokenExchangeResponse,
    LinkTokenAccountFilters,
    LinkTokenCreateResponse,
    PlaidApi,
    PlaidEnvironments,
    ProcessorTokenCreateRequestProcessorEnum,
    ProcessorTokenCreateResponse,
    Products,
    SandboxItemFireWebhookRequestWebhookCodeEnum,
    TransactionsGetResponse
} from 'plaid'
import { DataSource } from 'typeorm'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { PlaidAccountDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { PlaidAuthenticationErrorEvent } from '../user_account/events/plaid-authentication-error.event'
import { UserAccount } from '../user_account/user-account.entity'
import { logError, makeDinero } from '../utils/data.utils'
import { PlaidTokenType } from './plaid-token-type'

export const PLAID_DATE_FORMAT = 'yyyy-MM-dd'

export enum PlaidSupportedAccountType {
    DEPOSITORY = 'depository',
    CREDIT = 'credit'
}

export interface PlaidError {
    error_type: string
    error_code: string
    error_message: string
    display_message: string
    request_id: string
    status_code: number
}

@Injectable()
export class PlaidService {
    private readonly reAuthenticationErrorCodes = ['ITEM_LOGIN_REQUIRED', 'PENDING_EXPIRATION']
    private readonly logger = new Logger(PlaidService.name)

    constructor(
        @Inject(Provider.PLAID_CLIENT) private readonly plaidClient: PlaidApi,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        private readonly eventBus: EventBus
    ) {}

    /**
     * In sandbox mode only, use this to simulate a transaction webhook
     *
     * @param account
     */
    async fireWebhook(account: UserAccount): Promise<boolean> {
        if (
            this.configService.isDevelopment() &&
            this.configService.getPlaidEnvironment() === PlaidEnvironments.sandbox
        ) {
            const accessToken = await this.getAccessToken(account)
            await this.plaidClient.sandboxItemFireWebhook({
                access_token: accessToken,
                webhook_code: SandboxItemFireWebhookRequestWebhookCodeEnum.DefaultUpdate
            })

            return true
        }

        return false
    }

    async getDwollaProcessorToken(account: UserAccount): Promise<ProcessorTokenCreateResponse> {
        try {
            const accessToken = await this.getAccessToken(account)

            const response = await this.plaidClient.processorTokenCreate({
                access_token: accessToken,
                account_id: account.accountId,
                processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla
            })

            return response.data
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, account)
            }

            throw e
        }
    }

    /**
     * Necessary for establishing payments
     *
     * @param account
     */
    async getRoutingInfo(account: UserAccount): Promise<AuthGetResponse> {
        try {
            const accessToken = await this.getAccessToken(account)
            const response = await this.plaidClient.authGet({ access_token: accessToken })

            return response.data
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, account)
            }

            throw e
        }
    }

    /**
     * Necessary to determine if a particular person can make a payment or not
     *
     * @param account
     */
    async getAccounts(account: UserAccount): Promise<AccountsGetResponse> {
        try {
            const accessToken = await this.getAccessToken(account)
            const response = await this.plaidClient.accountsGet({ access_token: accessToken })

            return response.data
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, account)
            }

            throw e
        }
    }

    async getAccount(account: UserAccount, plaidAccountDto: PlaidAccountDto): Promise<AccountBase | null> {
        try {
            const accountsResponse = await this.getAccounts(account)

            // From the plaid docs: https://plaid.com/docs/link/duplicate-items/
            // You can compare a combination of the accounts’
            // institution_id, account name, and account mask to determine whether
            // your user has previously linked their account to your application.
            return accountsResponse.accounts.find(
                (plaidAccount) =>
                    plaidAccount.name === plaidAccountDto.name && plaidAccount.mask === plaidAccountDto.mask
            )
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, account)
            }

            throw e
        }
    }

    async getInstitution(id: string): Promise<Institution> {
        const response = await this.plaidClient.institutionsGetById({
            institution_id: id,
            country_codes: [CountryCode.Us],
            options: {
                include_optional_metadata: true
            }
        })

        return response.data.institution
    }

    /**
     * Deletes an account. Once deleted, the access token is no longer valid
     *
     * @see https://plaid.com/docs/api/items/#itemremove
     * @param account
     */
    async removeAccount(account: UserAccount): Promise<void> {
        const accessToken = await this.getAccessToken(account)

        await this.plaidClient.itemRemove({
            access_token: accessToken
        })
    }

    async getAvailableBalance(
        userAccount: UserAccount,
        agreement: SharedExpenseUserAgreement
    ): Promise<Dinero.Dinero | null> {
        try {
            const accessToken = await this.getAccessToken(userAccount)
            const response = await this.plaidClient.accountsBalanceGet({
                access_token: accessToken,
                options: {
                    account_ids: [userAccount.accountId],
                    // This field is required specifically for Capital One
                    min_last_updated_datetime: subDays(new Date(), 30).toISOString()
                }
            })
            const accounts = response.data.accounts
            const account = accounts.find((account) => account.account_id === userAccount.accountId)

            if (!account) {
                throw new HttpException(
                    `Could not obtain available balance for user: ${userAccount.userId} and account: ${userAccount.accountId}`,
                    HttpStatus.NOT_FOUND
                )
            }

            const availableBalance = account.balances.available

            if (!availableBalance) {
                return null
            }

            return makeDinero(availableBalance * 100)
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, userAccount, agreement)
            }

            throw e
        }
    }

    /**
     * Necessary to determine which transactions may be bills.
     *
     * From the Plaid docs:
     *
     * Attempting to retrieve transaction data for an Item before the initial
     * pull has completed triggers a PRODUCT_NOT_READY error. If you encounter
     * this, simply wait and retry your request or use webhooks to learn when
     * transaction data is available.
     *
     * @param account
     * @param beginningAt
     */
    async getTransactionHistory(account: UserAccount, beginningAt: Date = null): Promise<TransactionsGetResponse> {
        try {
            beginningAt = beginningAt || subDays(new Date(), 29)
            const accessToken = await this.getAccessToken(account)
            const formattedBeginningDate = this.formatBeginningDateForRequest(beginningAt)
            const now = format(new Date(), PLAID_DATE_FORMAT)
            const response = await this.plaidClient.transactionsGet({
                access_token: accessToken,
                start_date: formattedBeginningDate,
                end_date: now
            })

            return response.data
        } catch (e) {
            if (e?.response?.data) {
                this.handlePlaidError(e, account)
            }

            throw e
        }
    }

    /**
     * On update, supply an account to update
     *
     * @see https://plaid.com/docs/api/tokens/#link-token-create-request-account-filters
     * @param user
     * @param type
     * @param userAccount
     */
    async createLinkKitToken(
        user: User,
        type: PlaidTokenType,
        userAccount: UserAccount = null
    ): Promise<LinkTokenCreateResponse> {
        const products = this.getLinkProducts(type)
        const accountFilters = this.getLinkAccountFilters(type)

        try {
            const response = await this.plaidClient.linkTokenCreate({
                user: {
                    client_user_id: user.uuid
                },
                client_name: `Equater`,
                // from plaid: Note that no products should be specified when creating a link_token for update mode
                products: products,
                country_codes: [CountryCode.Us],
                language: 'en',
                webhook: `${this.configService.get(Environment.API_BASE)}/plaid/webhook/${user.id}`,
                account_filters: accountFilters,
                access_token: userAccount ? await this.getAccessToken(userAccount) : undefined,
                redirect_uri: this.getLinkRedirectUri(type),
                android_package_name: this.getLinkAndroidPackageName(type)
            })

            return response.data
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    /**
     * Item updates should not include a product list
     *
     * @param type
     * @private
     */
    private getLinkProducts(type: PlaidTokenType): Products[] {
        switch (type) {
            case PlaidTokenType.ITEM_UPDATE:
            case PlaidTokenType.ANDROID_ITEM_UPDATE:
                return undefined
            case PlaidTokenType.DEPOSITORY_ONLY:
            case PlaidTokenType.ANDROID_DEPOSITORY_ONLY:
                return [Products.Auth, Products.Transactions]
            case PlaidTokenType.CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY:
                return [Products.Transactions]
        }
    }

    /**
     * Item updates should not include account filters
     *
     * @param type
     * @private
     */
    private getLinkAccountFilters(type: PlaidTokenType): LinkTokenAccountFilters {
        switch (type) {
            case PlaidTokenType.ITEM_UPDATE:
            case PlaidTokenType.ANDROID_ITEM_UPDATE:
                return undefined
            case PlaidTokenType.DEPOSITORY_ONLY:
            case PlaidTokenType.ANDROID_DEPOSITORY_ONLY:
                return {
                    depository: {
                        account_subtypes: [AccountSubtype.Checking, AccountSubtype.Savings]
                    }
                }
            case PlaidTokenType.CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY:
                return {
                    depository: {
                        account_subtypes: [AccountSubtype.Checking, AccountSubtype.Savings]
                    },
                    credit: {
                        account_subtypes: [AccountSubtype.CreditCard]
                    }
                }
        }
    }

    /**
     * Annoyingly, Plaid can't handle both a redirect uri and an android package name
     *
     * @param type
     * @private
     */
    private getLinkRedirectUri(type: PlaidTokenType): string | undefined {
        switch (type) {
            case PlaidTokenType.DEPOSITORY_ONLY:
            case PlaidTokenType.CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ITEM_UPDATE:
                return `${this.configService.get(Environment.WEB_CLIENT)}/app/oauth-redirect`
            case PlaidTokenType.ANDROID_DEPOSITORY_ONLY:
            case PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ANDROID_ITEM_UPDATE:
                return undefined
        }
    }

    /**
     * Plaid needs us to differentiate between android/non-android tokens because it
     * can't accept both a redirect uri and an android package name
     *
     * @param type
     * @private
     */
    private getLinkAndroidPackageName(type: PlaidTokenType): string | undefined {
        switch (type) {
            case PlaidTokenType.DEPOSITORY_ONLY:
            case PlaidTokenType.CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ITEM_UPDATE:
                return undefined
            case PlaidTokenType.ANDROID_DEPOSITORY_ONLY:
            case PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY:
            case PlaidTokenType.ANDROID_ITEM_UPDATE:
                return this.configService.get(Environment.ANDROID_PACKAGE_NAME)
        }
    }

    async getCategories(): Promise<CategoriesGetResponse> {
        const response = await this.plaidClient.categoriesGet({})

        return response.data
    }

    async removeItem(account: UserAccount) {
        const token = await this.getAccessToken(account)

        await this.plaidClient.itemRemove({ access_token: token })
    }

    async resetLogin(account: UserAccount) {
        const token = await this.getAccessToken(account)

        await this.plaidClient.sandboxItemResetLogin({ access_token: token })
    }

    getReAuthenticationErrorCodes(): string[] {
        return this.reAuthenticationErrorCodes
    }

    private async getAccessToken(account: UserAccount): Promise<string> {
        return account.plaidAccessToken || (await this.exchangePublicToken(account)).plaidAccessToken
    }

    /**
     * Keeping the snake case localized to this function. All plaid SDK
     * requests require an access token, which you must provide a userProfile's
     * public token to exchange.
     *
     * @param account
     */
    async exchangePublicToken(account: UserAccount): Promise<UserAccount> {
        if (!account.plaidPublicToken) {
            throw new HttpException(`Bank account is not linked for this user account`, HttpStatus.BAD_REQUEST)
        }

        const response = await this.plaidClient.itemPublicTokenExchange({ public_token: account.plaidPublicToken })
        const data: ItemPublicTokenExchangeResponse = response.data
        const { access_token, item_id } = data
        account.plaidAccessToken = access_token
        account.plaidItemId = item_id

        return await this.dataSource.transaction(async (manager) => await manager.save(account))
    }

    private formatBeginningDateForRequest(date: Date): string {
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)

        return format(date, PLAID_DATE_FORMAT)
    }

    private handlePlaidError(e: AxiosError<PlaidError>, account: UserAccount, agreement?: SharedExpenseUserAgreement) {
        if (this.reAuthenticationErrorCodes.includes(e.response.data.error_code)) {
            this.eventBus.publish(new PlaidAuthenticationErrorEvent(e.response.data, account, agreement))
        }
    }
}
