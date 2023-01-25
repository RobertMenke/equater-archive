import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { instanceToPlain } from 'class-transformer'
import { FindOptionsWhere, In, Repository, UpdateResult } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { PlaidCategoryContext, PlaidCategoryService } from '../plaid_category/plaid-category.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { mapAsync } from '../utils/data.utils'
import { Transaction } from './transaction.entity'
import { UniqueVendor } from './unique-vendor.entity'

export interface PlaidTransactionContext {
    user: User
    account: UserAccount
    transaction: Transaction
    categoryContext: PlaidCategoryContext
}

@Injectable()
export class TransactionService implements DeletesManagedResources {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly userService: UserService,
        private readonly plaidCategoryService: PlaidCategoryService,
        private readonly userAccountService: UserAccountService
    ) {}

    findManyTransactionsBy(options: FindOptionsWhere<Transaction>): Promise<Transaction[]> {
        return this.transactionRepository.find({
            where: options
        })
    }

    findTransactionBy(options: FindOptionsWhere<Transaction>): Promise<Transaction | null> {
        return this.transactionRepository.findOne({
            where: options
        })
    }

    findByIds(ids: number[]): Promise<Transaction[]> {
        return this.transactionRepository.findByIds(ids)
    }

    async serializeTransactionsWithContext(transactions: Transaction[]): Promise<object[]> {
        const contexts = await mapAsync(transactions, (transaction) => this.getTransactionContext(transaction))

        return await mapAsync(contexts, (context) => this.serializeTransactionContext(context))
    }

    async getTransactionContext(transaction: Transaction): Promise<PlaidTransactionContext> {
        const account = await transaction.account
        const user = await account.user

        return {
            user,
            account,
            transaction,
            categoryContext: await this.plaidCategoryService.findCategoryContextForTransaction(transaction)
        }
    }

    async serializeTransactionContext(context: PlaidTransactionContext): Promise<object> {
        return {
            user: await this.userService.serializeUser(context.user),
            account: instanceToPlain(context.account, { excludePrefixes: ['__'] }),
            transaction: instanceToPlain(context.transaction, { excludePrefixes: ['__'] }),
            categoryContext: context.categoryContext
        }
    }

    /**
     * See documentation in [`AccountDeletionHandler.handle`]
     *
     * @param user
     */
    async deleteManagedResourcesForUser(user: User): Promise<void> {
        const accounts = await this.userAccountService.findWhere({
            userId: user.id
        })
        const accountIds = accounts.map((item) => item.id)
        const placeholderAccount = await this.userAccountService.findPlaceholderAccountReservedForDeletedAccountInfo()

        await this.transactionRepository.update(
            {
                accountId: In(accountIds)
            },
            {
                accountId: placeholderAccount.id
            }
        )
    }

    associateTransactionsWithAnotherVendor(
        originalVendor: UniqueVendor,
        correctVendor: UniqueVendor
    ): Promise<UpdateResult> {
        return this.transactionRepository.update(
            {
                uniqueVendorId: originalVendor.id
            },
            {
                uniqueVendorId: correctVendor.id
            }
        )
    }

    save(transaction: Transaction): Promise<Transaction | null> {
        try {
            return this.transactionRepository.save(transaction)
        } catch (e) {
            return null
        }
    }
}
