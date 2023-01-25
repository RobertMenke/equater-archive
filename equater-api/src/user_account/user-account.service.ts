import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { instanceToPlain } from 'class-transformer'
import { Response } from 'dwolla-v2'
import { fold, fromNullable } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/function'
import { Brackets, FindOptionsWhere, Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { DwollaService } from '../dwolla/dwolla.service'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidService, PlaidSupportedAccountType } from '../plaid/plaid.service'
import { ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY } from '../user/user.constants'
import { LinkBankAccountDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { logError, mapAsync } from '../utils/data.utils'
import { PlaidInstitution } from './plaid-institution.entity'
import { INSTITUTION_LOGO_PREFIX } from './user-account.constants'
import { SerializedUserAccount, UserAccount } from './user-account.entity'

@Injectable()
export class UserAccountService implements DeletesManagedResources {
    private readonly logger = new Logger(UserAccountService.name)

    constructor(
        @InjectRepository(UserAccount)
        private readonly repository: Repository<UserAccount>,
        @InjectRepository(PlaidInstitution)
        private readonly plaidInstitutionRepository: Repository<PlaidInstitution>,
        private readonly plaidService: PlaidService,
        private readonly s3Service: S3Service,
        private readonly configService: ConfigService,
        private readonly plaidLinkTokenService: PlaidLinkTokenService,
        private readonly dwollaService: DwollaService
    ) {}

    findOneWhere(options: FindOptionsWhere<UserAccount>): Promise<UserAccount | null> {
        return this.repository.findOne({ where: options })
    }

    findWhere(options: FindOptionsWhere<UserAccount>): Promise<UserAccount[]> {
        return this.repository.find({ where: options })
    }

    findOneInstitutionWhere(options: FindOptionsWhere<PlaidInstitution>): Promise<PlaidInstitution | null> {
        return this.plaidInstitutionRepository.findOne({ where: options })
    }

    findInstitutionWhere(options: FindOptionsWhere<PlaidInstitution>): Promise<PlaidInstitution[]> {
        return this.plaidInstitutionRepository.find({ where: options })
    }

    async findOrCreateInstitution(institutionId: string): Promise<PlaidInstitution> {
        const institution = await this.findOneInstitutionWhere({ institutionId })

        if (institution) {
            return institution
        }

        return await this.saveInstitution(institutionId)
    }

    async getAccountsForUser(user: User): Promise<UserAccount[]> {
        const accounts = await this.findAllActive(user)

        return await this.serializeAccounts(user, accounts)
    }

    /**
     * Important: follow the order of operations defined in [AccountDeletionHandler.handle]
     * This should be one of the last deletion operations called because there are several
     * foreign key references to [`UserAccount`]
     *
     * @param user
     */
    async deleteManagedResourcesForUser(user: User): Promise<void> {
        const accounts = await this.findWhere({ userId: user.id })

        for (const account of accounts) {
            if (account.plaidAccessToken && !account.hasRemovedFundingSource) {
                await this.plaidService.removeAccount(account)
                await this.dwollaService.removeFundingSource(account)
            }
        }

        await this.repository.delete({
            userId: user.id
        })
    }

    findAllActive(user: User): Promise<UserAccount[]> {
        const qb = this.repository.createQueryBuilder('qb')

        qb.where(
            new Brackets((qb) => {
                qb.where('userId = :userId', {
                    userId: user.id
                })
                qb.andWhere('isActive = 1')
            })
        )

        // Only show depository accounts if they've been connected via Dwolla
        // and only show credit cards if they've been linked via Plaid's LinkKit directly
        qb.andWhere(
            new Brackets((qb) => {
                qb.where(
                    'accountType = :accountType and dwollaFundingSourceId IS NOT NULL AND dwollaFundingSourceUrl IS NOT NULL',
                    {
                        accountType: PlaidSupportedAccountType.DEPOSITORY
                    }
                )

                qb.orWhere('accountType = :type AND plaidItemId IS NOT NULL', {
                    type: PlaidSupportedAccountType.CREDIT
                })
            })
        )

        return qb.getMany()
    }

    serializeAccounts(user: User, accounts: UserAccount[]): Promise<SerializedUserAccount[]> {
        return mapAsync(accounts, (account) => this.serializeAccount(user, account))
    }

    async serializeAccount(user: User, account: UserAccount): Promise<SerializedUserAccount> {
        if (account.requiresPlaidReAuthentication) {
            await this.plaidLinkTokenService.updateItemUpdateTokenIfNecessary(user, account)
        }

        const institution = await this.findOneInstitutionWhere({ id: account.plaidInstitutionId })
        institution.logoUrl = await this.createPreSignedInstitutionLogoUrl(institution)

        return {
            ...instanceToPlain(account, { excludePrefixes: ['__'] }),
            institution,
            linkTokens: await this.plaidLinkTokenService.findForAccount(account)
        } as SerializedUserAccount
    }

    /**
     * Primarily useful during the initial transaction pull. Can throw if a duplicate
     * account is attempted to be inserted.
     *
     * @param account
     */
    async save(account: UserAccount): Promise<UserAccount | null> {
        try {
            return await this.repository.save(account)
        } catch (e) {
            return null
        }
    }

    async updateOrCreateAccount(user: User, dto: LinkBankAccountDto) {
        const account = await this.repository.findOne({
            where: {
                userId: user.id,
                accountId: dto.metaData.account.id
            }
        })

        const institution = await this.findOrCreateInstitution(dto.metaData.institution.institutionId)

        return pipe(
            fromNullable(account),
            fold(
                () => this.createAccount(user, dto, institution),
                (userAccount) => this.updateAccount(user, dto, userAccount, institution)
            )
        )
    }

    async createAccount(user: User, dto: LinkBankAccountDto, institution: PlaidInstitution) {
        const entity = this.mapDtoToEntity(user, dto, institution)

        try {
            return await this.repository.save(entity)
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    updateAccount(user: User, dto: LinkBankAccountDto, account: UserAccount, institution: PlaidInstitution) {
        const entity = account.assign(this.mapDtoToEntity(user, dto, institution))

        return this.repository.save(entity)
    }

    /**
     *
     * @param account
     * @param response
     */
    setDwollaFundingSource(account: UserAccount, response: Response): Promise<UserAccount> {
        account.dwollaFundingSourceUrl = response.headers.get('location')
        account.dwollaFundingSourceId = account.dwollaFundingSourceUrl.split('/').pop()

        return this.repository.save(account)
    }

    async removeFundingSource(account: UserAccount): Promise<UserAccount[]> {
        const accounts = await this.findWhere({ userId: account.userId })
        const accountsFromSameInstitution = accounts
            .filter((item) => item.institutionId === account.institutionId)
            .map((item) => {
                item.hasRemovedFundingSource = true
                item.isActive = false

                return item
            })

        return this.repository.save(accountsFromSameInstitution)
    }

    findPlaceholderAccountReservedForDeletedAccountInfo() {
        return this.findOneWhere({
            accountName: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY
        })
    }
    /**
     * If a user chooses to delete their account, we delete all of their data, but
     * transactions we may have stored may be referenced from `UniqueVendor` records,
     * which we do want to keep.
     *
     * In order to hackishly get around this, we have an account dedicated to serving as a reference
     * for transactions recorded by users who have chosen to delete their accounts.
     *
     * @param user
     */
    async createPlaceholderAccountForDeletedUsersTransactionHistory(user: User) {
        const existingAccount = await this.findPlaceholderAccountReservedForDeletedAccountInfo()

        if (existingAccount) {
            return existingAccount
        }

        const [plaidInstitution] = await this.plaidInstitutionRepository.find()

        // If we don't yet have an institution, don't worry about creating a placeholder account yet
        if (!plaidInstitution) {
            return
        }

        const account = new UserAccount({
            userId: user.id,
            accountId: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            accountName: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            accountSubType: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            accountType: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            accountMask: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            plaidInstitutionId: plaidInstitution.id,
            institutionId: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            institutionName: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            plaidPublicToken: ACCOUNT_RESERVED_FOR_DELETED_USERS_TRANSACTION_HISTORY,
            isActive: false
        })

        return await this.repository.save(account)
    }

    private mapDtoToEntity(user: User, dto: LinkBankAccountDto, institution: PlaidInstitution): UserAccount {
        return new UserAccount({
            userId: user.id,
            accountId: dto.metaData.account.id,
            accountName: dto.metaData.account.name,
            accountSubType: dto.metaData.account.subtype,
            accountType: dto.metaData.account.type,
            accountMask: dto.metaData.account.mask,
            plaidInstitutionId: institution.id,
            institutionId: dto.metaData.institution.institutionId,
            institutionName: dto.metaData.institution.name,
            plaidPublicToken: dto.token,
            isActive: true
        })
    }

    saveAccessToken(account: UserAccount, accessToken: string, itemId: string) {
        account.plaidAccessToken = accessToken
        account.plaidItemId = itemId

        return this.repository.save(account)
    }

    /**
     * Since a plaid item id represents a user and financial institution combo, when we re-authenticate
     * an account with plaid we need to ensure that all accounts are marked as no longer requiring re-authentication
     *
     * @param account
     */
    async handlePlaidAuthentication(account: UserAccount): Promise<UserAccount[]> {
        if (!account.plaidItemId) {
            throw new HttpException(`Tried to update an account without an item id`, HttpStatus.BAD_REQUEST)
        }

        const accounts = await this.findWhere({ plaidItemId: account.plaidItemId, isActive: true })
        const updatedAccounts = accounts.map((account) => {
            account.requiresPlaidReAuthentication = false
            return account
        })

        return await this.repository.save(updatedAccounts)
    }

    requirePlaidUpdate(account: UserAccount): Promise<UserAccount> {
        account.requiresPlaidReAuthentication = true

        return this.save(account)
    }

    async saveInstitution(institutionId: string): Promise<PlaidInstitution> {
        const institution = await this.plaidService.getInstitution(institutionId)
        const uniqueId = uuid()
        const image = institution.logo ? Buffer.from(institution.logo, 'base64') : undefined
        const bucket = institution.logo ? this.configService.get(Environment.S3_PHOTOS_BUCKET) : null
        const key = institution.logo ? `${INSTITUTION_LOGO_PREFIX}/${uniqueId}` : null
        let hash = null

        if (institution.logo) {
            await this.s3Service.createWriteStream({
                Bucket: bucket,
                Key: key,
                Body: image
            })

            hash = await this.s3Service.hashFile({
                Bucket: bucket,
                Key: key
            })
        }

        const entity = new PlaidInstitution({
            uuid: uuid(),
            institutionId: institution.institution_id,
            name: institution.name,
            websiteUrl: institution.url,
            primaryColorHexCode: institution.primary_color,
            usesOauthLoginFlow: institution.oauth,
            logoS3Bucket: bucket,
            logoS3Key: key,
            logoSha256Hash: hash
        })

        return await this.plaidInstitutionRepository.save(entity)
    }

    private createPreSignedInstitutionLogoUrl(institution: PlaidInstitution): Promise<string | null> {
        if (!institution.logoS3Key || !institution.logoS3Bucket) {
            return null
        }

        return this.s3Service.createPreSignedDownloadUrl({
            Bucket: institution.logoS3Bucket,
            Key: institution.logoS3Key
        })
    }
}
