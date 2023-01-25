import { Injectable, Logger } from '@nestjs/common'
import { parse } from 'date-fns'
import { AccountBase, Transaction, TransactionsGetResponse } from 'plaid'
import { PlaidService } from '../plaid/plaid.service'
import { PlaidWebHookCode, Transaction as TransactionEntity } from '../transaction/transaction.entity'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { flatMapAsync, logError, makeDinero, mapNotNullAsync } from '../utils/data.utils'

//TODO: Look into https://github.com/nestjsx/nest-bull
//TODO: for processing transaction pulls in a separate thread or at least a queue
@Injectable()
export class TransactionPullService {
    private readonly logger = new Logger(TransactionPullService.name)

    constructor(
        private readonly accountService: UserAccountService,
        private readonly transactionService: TransactionService,
        private readonly vendorService: VendorService,
        private readonly plaidService: PlaidService
    ) {}

    /**
     * Objectives:
     * - Any time a vendor we haven't seen before shows up in a transaction, create a UniqueVendor record
     * - Add additional accounts they may have as inactive so that we're able to correlate transaction history with accounts
     * - Record previous transactions associated with the supplied account so that we have a baseline of financial activity
     *
     * @param user
     */
    async parseHistoricalTransactionPull(user: User): Promise<TransactionEntity[]> {
        const accounts = await this.accountService.findWhere({
            userId: user.id,
            isActive: true
        })

        return await flatMapAsync(accounts, async (account) => {
            const data = await this.plaidService.getTransactionHistory(account, account.dateOfLastPlaidTransactionPull)

            return await this.storeTransactions(user, account, data)
        })
    }

    async storeTransactions(
        user: User,
        activeAccount: UserAccount,
        { accounts, transactions, total_transactions }: TransactionsGetResponse
    ): Promise<TransactionEntity[]> {
        this.logger.log(`Processing ${total_transactions} transactions for user ${user.id}`)

        const userAccounts = await mapNotNullAsync(accounts, (account) => this.mapAccount(user, account, activeAccount))

        return await mapNotNullAsync(transactions, async (transaction) => {
            try {
                const uniqueVendor = await this.vendorService.findOrCreateUniqueVendor(transaction)
                // Look for an existing transaction so we don't process it twice
                const existingTransaction = await this.transactionService.findTransactionBy({
                    transactionId: transaction.transaction_id
                })

                if (existingTransaction) {
                    return null
                }

                const transactionEntity = await this.createTransaction(userAccounts, transaction, uniqueVendor)

                if (transactionEntity) {
                    return await this.transactionService.save(transactionEntity)
                }
            } catch (e) {
                // These get processed concurrently, so account for race conditions here
                // The most likely cause of an error is a duplicate entry that occurred
                // between querying and saving the transaction
                const existingTransaction = await this.transactionService.findTransactionBy({
                    transactionId: transaction.transaction_id
                })

                if (existingTransaction) {
                    return null
                }

                logError(this.logger, e)
            }

            return null
        })
    }

    createTransaction(
        accounts: UserAccount[],
        transaction: Transaction,
        vendor: UniqueVendor
    ): Promise<TransactionEntity | undefined> {
        const account = accounts.find((account) => account.accountId === transaction.account_id)

        if (!account) {
            return undefined
        }

        const transactionEntity = new TransactionEntity({
            accountId: account.id,
            uniqueVendorId: vendor.id,
            categoryId: transaction.category_id,
            accountOwner: transaction.account_owner,
            amount: makeDinero(Math.ceil(transaction.amount * 100)),
            date: parse(transaction.date, 'yyyy-MM-dd', new Date()),
            authorizedDate: parse(transaction.authorized_date, 'yyyy-MM-dd', new Date()),
            dateTimeCaptured: new Date(),
            isoCurrencyCode: transaction.iso_currency_code,
            isPending: transaction.pending || false,
            pendingTransactionId: transaction.pending_transaction_id,
            transactionId: transaction.transaction_id,
            unofficialCurrencyCode: transaction.unofficial_currency_code,
            plaidWebHookCode: PlaidWebHookCode.HISTORICAL_UPDATE,
            paymentChannel: transaction.payment_channel,
            address: transaction.location.address,
            city: transaction.location.city,
            country: transaction.location.country,
            latitude: transaction.location.lat,
            longitude: transaction.location.lon,
            postalCode: transaction.location.postal_code,
            region: transaction.location.region,
            storeNumber: transaction.location.store_number,
            byOrderOf: transaction.payment_meta.by_order_of,
            payee: transaction.payment_meta.payee,
            paymentMethod: transaction.payment_meta.payment_method,
            ppdId: transaction.payment_meta.ppd_id,
            reason: transaction.payment_meta.reason,
            referenceNumber: transaction.payment_meta.reference_number,
            transactionName: transaction.name,
            merchantName: transaction.merchant_name
        })

        return this.transactionService.save(transactionEntity)
    }

    private async mapAccount(
        user: User,
        account: AccountBase,
        activeAccount: UserAccount
    ): Promise<UserAccount | null> {
        if (account.account_id === activeAccount.accountId) {
            return activeAccount
        }

        const existingAccount = await this.accountService.findOneWhere({ accountId: account.account_id })

        if (existingAccount) {
            return existingAccount
        }

        const institution = await this.accountService.findOrCreateInstitution(activeAccount.institutionId)
        const userAccount = new UserAccount({
            userId: user.id,
            accountId: account.account_id,
            accountName: account.name,
            accountSubType: account.subtype,
            accountType: account.type,
            accountMask: account.mask,
            institutionId: activeAccount.institutionId,
            institutionName: activeAccount.institutionName,
            plaidPublicToken: null,
            // Remember, we're looking at active accounts 1 by 1 here. If the account wasn't already
            // in our list of active accounts it hasn't been linked by plaid and therefore is not
            // considered "active" in our system
            isActive: false,
            plaidInstitutionId: institution.id
        })

        return await this.accountService.save(userAccount)
    }
}
