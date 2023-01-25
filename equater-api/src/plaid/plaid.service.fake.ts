import { Inject, Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { addDays } from 'date-fns'
import * as Dinero from 'dinero.js'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import { join } from 'path'
import {
    AccountBase,
    AccountsGetResponse,
    AuthGetResponse,
    CategoriesGetResponse,
    CountryCode,
    Institution,
    LinkTokenCreateResponse,
    PlaidApi,
    ProcessorTokenCreateResponse,
    TransactionsGetResponse
} from 'plaid'
import { DataSource } from 'typeorm'
import { promisify } from 'util'
import { v4 as uuid } from 'uuid'
import { ConfigService, Provider } from '../config/config.service'
import { SharedExpenseUserAgreement } from '../shared_expense/shared-expense-user-agreement.entity'
import { PlaidAccountDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { PlaidAuthenticationErrorEvent } from '../user_account/events/plaid-authentication-error.event'
import { UserAccount } from '../user_account/user-account.entity'
import { makeDinero, randomBetween } from '../utils/data.utils'

const mocksDirectory = join(__dirname, '/../../test/samples/plaid')
const samplesDirectory = join(__dirname, '/../../test/samples')
const readFile = promisify(fs.readFile)

@Injectable()
export class PlaidServiceFake {
    static availableBalance: number = randomBetween(10000, 1000000)
    static ACCOUNT_ID = null
    static shouldThrowAuthError = false
    static linkTokenExpiration = addDays(new Date(), 1)
    static institutionLogoSource = `${samplesDirectory}/vendor_brand_assets/netflix.png`

    constructor(
        @Inject(Provider.PLAID_CLIENT) private readonly plaidClient: PlaidApi,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        private readonly eventBus: EventBus
    ) {}

    async getRoutingInfo(account: UserAccount): Promise<AuthGetResponse> {
        if (PlaidServiceFake.shouldThrowAuthError) {
            this.throwPlaidError(account)
        }

        const fileContents = await readFile(mocksDirectory + '/auth.json')
        const json = JSON.parse(fileContents.toString('utf8'))

        if (PlaidServiceFake.ACCOUNT_ID) {
            json.numbers.ach[0].account_id = PlaidServiceFake.ACCOUNT_ID
        }

        return json as AuthGetResponse
    }

    async getAccounts(account: UserAccount): Promise<AccountsGetResponse> {
        if (PlaidServiceFake.shouldThrowAuthError) {
            this.throwPlaidError(account)
        }

        const fileContents = await readFile(mocksDirectory + '/accounts.json')
        const json = JSON.parse(fileContents.toString('utf8'))

        return json as AccountsGetResponse
    }

    async getAccount(account: UserAccount, plaidAccountDto: PlaidAccountDto): Promise<AccountBase | null> {
        if (PlaidServiceFake.shouldThrowAuthError) {
            this.throwPlaidError(account)
        }

        const fileContents = await readFile(mocksDirectory + '/accounts.json')
        const json = JSON.parse(fileContents.toString('utf8')) as AccountsGetResponse

        return json.accounts.find((account) => account.name === plaidAccountDto.name)
    }

    async getInstitution(id: string): Promise<Institution> {
        const logo = await readFile(PlaidServiceFake.institutionLogoSource)

        return {
            logo: logo.toString('base64'),
            primary_color: '#7A04EB',
            url: faker.internet.url(),
            credentials: [],
            has_mfa: true,
            institution_id: id,
            mfa: [],
            name: faker.company.name(),
            products: [],
            country_codes: [CountryCode.Us],
            oauth: true,
            routing_numbers: []
        }
    }

    removeAccount(account: UserAccount): Promise<void> {
        return Promise.resolve()
    }

    async getAvailableBalance(userAccount: UserAccount, agreement: SharedExpenseUserAgreement): Promise<Dinero.Dinero> {
        if (PlaidServiceFake.shouldThrowAuthError) {
            this.throwPlaidError(userAccount, agreement)
        }

        return makeDinero(PlaidServiceFake.availableBalance)
    }

    async getTransactionHistory(account: UserAccount, beginningAt: Date = null): Promise<TransactionsGetResponse> {
        if (PlaidServiceFake.shouldThrowAuthError) {
            this.throwPlaidError(account)
        }

        const fileContents = await readFile(mocksDirectory + '/transactions.json')
        const json = JSON.parse(fileContents.toString('utf8'))

        return json as TransactionsGetResponse
    }

    async createLinkKitToken(user: User, userAccount: UserAccount = null): Promise<LinkTokenCreateResponse> {
        return {
            expiration: PlaidServiceFake.linkTokenExpiration.toISOString(),
            link_token: uuid(),
            request_id: uuid()
        }
    }

    async getCategories(): Promise<CategoriesGetResponse> {
        const fileContents = await readFile(mocksDirectory + '/categories.json')
        const json = JSON.parse(fileContents.toString('utf8'))

        return json as CategoriesGetResponse
    }

    getDwollaProcessorToken(account: UserAccount): Promise<ProcessorTokenCreateResponse> {
        return Promise.resolve({
            request_id: uuid(),
            processor_token: uuid()
        })
    }

    async exchangePublicToken(account: UserAccount): Promise<UserAccount> {
        const { access_token, item_id } = {
            access_token: uuid(),
            item_id: uuid()
        }

        account.plaidAccessToken = access_token
        account.plaidItemId = item_id

        return await this.dataSource.transaction(async (manager) => await manager.save(account))
    }

    private throwPlaidError(account: UserAccount, agreement?: SharedExpenseUserAgreement) {
        const error = {
            response: {
                data: {
                    name: 'PlaidError',
                    display_message: null,
                    error_code: 'ITEM_LOGIN_REQUIRED',
                    error_message:
                        "the login details of this item have changed (credentials, MFA, or required user action) and a user login is required to update this information. use Link's update mode to restore the item to a good state",
                    error_type: 'ITEM_ERROR',
                    request_id: 'MbGrKjOKxWGBHBb',
                    suggested_action: null,
                    status_code: 400
                }
            }
        }
        this.eventBus.publish(new PlaidAuthenticationErrorEvent(error.response.data, account, agreement))
        throw error
    }
}
