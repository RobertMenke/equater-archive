import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, FindOptionsWhere, In, Repository } from 'typeorm'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { mapAsync } from '../utils/data.utils'
import { PlaidLinkToken } from './plaid-link-token.entity'
import { PlaidTokenType } from './plaid-token-type'
import { PlaidService } from './plaid.service'

@Injectable()
export class PlaidLinkTokenService {
    constructor(
        @InjectRepository(PlaidLinkToken)
        private readonly linkTokenRepository: Repository<PlaidLinkToken>,
        private readonly plaidService: PlaidService
    ) {}

    findLinkTokensWhere(options: FindOptionsWhere<PlaidLinkToken>): Promise<PlaidLinkToken[]> {
        return this.linkTokenRepository.find({
            where: options
        })
    }

    findForUser(user: User): Promise<PlaidLinkToken[]> {
        return this.findLinkTokensWhere({ userId: user.id })
    }

    findForAccount(account: UserAccount): Promise<PlaidLinkToken[]> {
        return this.findLinkTokensWhere({ userId: account.userId, userAccountId: account.id })
    }

    async prepareForUserDeletion(user: User, substituteUser: User, placeholderAccount: UserAccount): Promise<void> {
        const tokens = await this.findForUser(user)
        const updatedTokens = tokens.map((token) => {
            token.userId = substituteUser.id
            token.userAccountId = placeholderAccount.id

            return token
        })

        await this.linkTokenRepository.save(updatedTokens)
    }

    async updateItemUpdateTokenIfNecessary(user: User, account: UserAccount) {
        const tokens = await this.findLinkTokensWhere({
            userId: user.id,
            userAccountId: account.id,
            tokenType: In([PlaidTokenType.ITEM_UPDATE, PlaidTokenType.ANDROID_ITEM_UPDATE])
        })

        await this.updateOrCreateLinkTokenByType(user, PlaidTokenType.ITEM_UPDATE, tokens, account)
        await this.updateOrCreateLinkTokenByType(user, PlaidTokenType.ANDROID_ITEM_UPDATE, tokens, account)
    }

    removeItemUpdateTokensForAccount(account: UserAccount): Promise<DeleteResult> {
        return this.linkTokenRepository.delete({
            userId: account.userId,
            userAccountId: account.id,
            tokenType: In([PlaidTokenType.ITEM_UPDATE, PlaidTokenType.ANDROID_ITEM_UPDATE])
        })
    }

    /**
     * A user always need to have a valid plaid link token when using the app
     * in case they need to link an additional account.
     *
     * A user account should be supplied with this is an item update
     *
     * @param user
     */
    async updatePlaidLinkTokenIfNecessary(user: User): Promise<PlaidLinkToken[]> {
        const tokens = await this.findLinkTokensWhere({ userId: user.id })
        const tokenTypesToUpdate: PlaidTokenType[] = [
            PlaidTokenType.DEPOSITORY_ONLY,
            PlaidTokenType.CREDIT_AND_DEPOSITORY,
            PlaidTokenType.ANDROID_DEPOSITORY_ONLY,
            PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY
        ]

        await mapAsync(tokenTypesToUpdate, (tokenType) => this.updateOrCreateLinkTokenByType(user, tokenType, tokens))

        return await this.findLinkTokensWhere({ userId: user.id })
    }

    async forceUpdateLinkTokensByType(
        user: User,
        types: PlaidTokenType[],
        account: UserAccount = null
    ): Promise<PlaidLinkToken[]> {
        const tokens = await this.findLinkTokensWhere({
            userId: user.id,
            tokenType: In(types)
        })

        await mapAsync(types, (type) => this.updateOrCreateLinkTokenByType(user, type, tokens, account, true))

        return await this.findLinkTokensWhere({ userId: user.id })
    }

    private async updateOrCreateLinkTokenByType(
        user: User,
        type: PlaidTokenType,
        tokens: PlaidLinkToken[],
        account: UserAccount = null,
        forceUpdate: boolean = false
    ): Promise<PlaidLinkToken> {
        const entity = tokens.find((token) => token.tokenType === type)

        if (!entity) {
            return await this.createLinkToken(user, type, account)
        }

        // Token needs to be updated if it's expired. Can optionally be force-updated any time
        // we know the previous one has already been used.
        if (forceUpdate || entity.dateTimeTokenExpires.getTime() < Date.now()) {
            const response = await this.plaidService.createLinkKitToken(user, type, account)
            entity.plaidLinkToken = response.link_token
            entity.dateTimeTokenCreated = new Date()
            entity.dateTimeTokenExpires = new Date(Date.parse(response.expiration))

            return await this.linkTokenRepository.save(entity)
        }

        return entity
    }

    private async createLinkToken(
        user: User,
        type: PlaidTokenType,
        account: UserAccount = null
    ): Promise<PlaidLinkToken> {
        const response = await this.plaidService.createLinkKitToken(user, type, account)
        const entity = new PlaidLinkToken({
            userId: user.id,
            userAccountId: account ? account.id : null,
            tokenType: type,
            plaidLinkToken: response.link_token,
            dateTimeTokenExpires: new Date(Date.parse(response.expiration))
        })

        return await this.linkTokenRepository.save(entity)
    }
}
