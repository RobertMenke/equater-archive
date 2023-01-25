import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { Dinero } from 'dinero.js'
import { faker } from '@faker-js/faker'
import {
    AccountBase,
    AccountBaseVerificationStatusEnum,
    Item,
    ItemUpdateTypeEnum,
    Products,
    Transaction as PlaidTransaction,
    TransactionPaymentChannelEnum,
    TransactionsGetResponse
} from 'plaid'

@Injectable()
export class PlaidMockService {
    /**
     * Mocks a transactions response with a single transaction which is usually sufficient
     * for testing
     *
     * @param account
     * @param vendor
     * @param amount
     * @param availableBalance
     * @param isPending
     */
    mockPlaidTransactionsResponse(
        account: string,
        vendor: string,
        amount: Dinero,
        availableBalance: Dinero,
        isPending: boolean = false
    ): TransactionsGetResponse {
        return {
            total_transactions: 1,
            item: this.mockItem(),
            request_id: faker.random.alphaNumeric(10),
            accounts: [this.mockAccount(account, availableBalance)],
            transactions: [this.mockTransaction(account, amount, vendor, isPending)]
        }
    }

    private mockItem(): Item {
        return {
            available_products: [Products.Auth, Products.Transactions],
            billed_products: [],
            error: null,
            institution_id: faker.company.name(),
            item_id: faker.random.alphaNumeric(10),
            webhook: faker.internet.url(),
            consent_expiration_time: null,
            update_type: ItemUpdateTypeEnum.Background
        }
    }

    private mockAccount(account: string, availableBalance: Dinero): AccountBase {
        return {
            account_id: account,
            mask: faker.finance.mask(4),
            name: faker.finance.accountName(),
            official_name: faker.finance.accountName(),
            verification_status: AccountBaseVerificationStatusEnum.PendingAutomaticVerification,
            subtype: null,
            type: null,
            balances: {
                available: availableBalance.getAmount(),
                current: availableBalance.getAmount(),
                limit: null,
                iso_currency_code: 'usd',
                unofficial_currency_code: 'usd'
            }
        }
    }

    private mockTransaction(
        account: string,
        amount: Dinero,
        vendor: string,
        isPending: boolean = false
    ): PlaidTransaction {
        return {
            authorized_datetime: null,
            check_number: null,
            datetime: null,
            original_description: null,
            personal_finance_category: null,
            account_id: account,
            account_owner: null,
            amount: amount.getAmount() / 100, // Plaid transactions come in in dollars and dinero uses cents
            iso_currency_code: 'usd',
            unofficial_currency_code: 'usd',
            category: ['service'],
            category_id: faker.random.alphaNumeric(10),
            date: format(new Date(), 'yyy-MM-dd'),
            location: {
                address: null,
                city: null,
                lat: null,
                lon: null,
                region: null,
                store_number: null,
                postal_code: null,
                country: null
            },
            merchant_name: vendor,
            name: vendor,
            payment_meta: {
                by_order_of: null,
                payee: null,
                payer: null,
                payment_method: null,
                payment_processor: null,
                ppd_id: null,
                reason: null,
                reference_number: null
            },
            pending: isPending,
            pending_transaction_id: isPending ? null : faker.random.alphaNumeric(10),
            authorized_date: new Date().toISOString(),
            payment_channel: TransactionPaymentChannelEnum.Other,
            transaction_id: faker.random.alphaNumeric(10),
            transaction_type: null,
            transaction_code: null
        }
    }
}
