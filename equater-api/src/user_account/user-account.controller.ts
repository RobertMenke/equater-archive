import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    Request,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { AccountUpdateGuard } from '../guards/auth/account-update.guard'
import { AdminOrSelfGuard } from '../guards/auth/admin-or-self.guard'
import {
    AuthenticatedAccountRequest,
    AuthenticatedRequest,
    AuthenticationGuard
} from '../guards/auth/authentication.guard'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidTokenType } from '../plaid/plaid-token-type'
import { PlaidService, PlaidSupportedAccountType } from '../plaid/plaid.service'
import { FindActiveExpensesForAccountCommand } from '../shared_expense/commands/find-active-expenses-for-account.command'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { DwollaIntegrationService } from '../user/dwolla-integration.service'
import { LinkBankAccountDto } from '../user/user.dtos'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { logError, mapAsync } from '../utils/data.utils'
import { UserAccount } from './user-account.entity'
import { UserAccountService } from './user-account.service'

@Controller('api/account')
@UseGuards(AuthenticationGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class UserAccountController {
    private readonly logger = new Logger(UserAccountController.name)

    constructor(
        private readonly userService: UserService,
        private readonly plaidService: PlaidService,
        private readonly userAccountService: UserAccountService,
        private readonly dwollaService: DwollaIntegrationService,
        private readonly plaidLinkTokenService: PlaidLinkTokenService,
        private readonly commandBus: CommandBus
    ) {}

    @Get()
    getUserAccounts(@Request() request: AuthenticatedRequest) {
        const user: User = request.user

        return this.userAccountService.getAccountsForUser(user)
    }

    @UseGuards(new AdminOrSelfGuard('userId'))
    @Get('user/:userId')
    async getAccountsForUser(@Param('userId', new ParseIntPipe()) userId: number, @Query('active') active: string) {
        const filterByActive = active === 'true'
        const user = await this.userService.findOneWhere({ id: userId })

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }

        const accounts = filterByActive
            ? await this.userAccountService.findAllActive(user)
            : await this.userAccountService.findWhere({ userId: user.id })

        return await this.userAccountService.serializeAccounts(user, accounts)
    }

    /**
     * Note: In the sandbox, linking multiple checking/savings accounts from different banks will error
     * on Dwolla's end with a "DuplicateResource" code. This is because Plaid hard-codes account & routing
     * numbers in the sandbox for different account types. In production, this should not be an issue.
     *
     * @link https://discuss.dwolla.com/t/dwolla-plaid-add-funding-resource-not-allows-to-add-more-than-2-banks/5807
     *
     * @param request
     * @param dto
     */
    @Patch('link-bank-account')
    async linkBankAccount(@Request() request: AuthenticatedRequest, @Body() dto: LinkBankAccountDto) {
        let user = request.user
        // If the user has already linked an account with this financial institution we don't want to link it twice
        // In Plaid's world a financial institution represents an "Item" and selecting different accounts within the Item
        // shouldn't require re-linking
        const existingAccounts = await this.userAccountService.findWhere({
            userId: user.id,
            hasRemovedFundingSource: false
        })
        const accountFromMatchingInstitution = existingAccounts.find(
            (account) => account.institutionId === dto.metaData.institution.institutionId
        )

        // When a matching institution is found, lookup the account from Plaid and save it in the database as active
        const patchedAccount = accountFromMatchingInstitution
            ? await this.linkAccountFromExistingInstitution(user, dto, accountFromMatchingInstitution)
            : await this.linkAccountFromNewInstitution(user, dto)

        // Dwolla can only handle linking depository accounts, so if we link a credit card
        // don't try to attach it as a funding source with Dwolla
        if (patchedAccount.accountType === PlaidSupportedAccountType.DEPOSITORY) {
            user = await this.dwollaService.createOrUpdateCustomer(user)
            await this.dwollaService.createFundingSource(user, patchedAccount)
        }

        await this.userAccountService.handlePlaidAuthentication(patchedAccount)
        // If we've already exchanged the plaid token, create another one because they're only good for 1-time use
        if (!accountFromMatchingInstitution) {
            await this.plaidLinkTokenService.forceUpdateLinkTokensByType(user, [
                PlaidTokenType.DEPOSITORY_ONLY,
                PlaidTokenType.ANDROID_DEPOSITORY_ONLY,
                PlaidTokenType.CREDIT_AND_DEPOSITORY,
                PlaidTokenType.ANDROID_CREDIT_AND_DEPOSITORY
            ])
        }

        const allAccounts = await this.userAccountService.getAccountsForUser(user)

        return {
            user: await this.userService.serializeUser(user),
            userAccounts: await this.userAccountService.serializeAccounts(user, allAccounts)
        }
    }

    /**
     * From Plaid: An Item's access_token does not change when using Link in update mode, so there is no need to repeat the exchange token process.
     *
     * @link https://plaid.com/docs/link/update-mode/
     * @param request
     * @param accountId
     */
    @Patch(':accountId/update-bank-account')
    @UseGuards(AccountUpdateGuard)
    async updateBankAccount(@Request() request: AuthenticatedAccountRequest, @Param('accountId') accountId: number) {
        const account = request.account
        const updatedAccounts = await this.userAccountService.handlePlaidAuthentication(account)
        // Now that we've performed a successful update for this account, remove any item updates
        await mapAsync(updatedAccounts, async (account) => {
            await this.plaidLinkTokenService.removeItemUpdateTokensForAccount(account)
        })
        const updatedAccount = updatedAccounts.find((item) => item.id === account.id)

        if (!updatedAccount) {
            throw new HttpException(`Failed to update account`, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        return await this.userAccountService.serializeAccount(await updatedAccount.user, updatedAccount)
    }

    @Patch(':accountId/unlink-bank-account')
    @UseGuards(AccountUpdateGuard)
    async unlinkBankAccount(@Request() request: AuthenticatedAccountRequest) {
        const account = request.account

        const activeExpensesForAccount: SharedExpense[] = await this.commandBus.execute(
            new FindActiveExpensesForAccountCommand(account)
        )

        if (activeExpensesForAccount.length > 0) {
            throw new HttpException(
                `Cannot remove account with active shared bills or recurring payments`,
                HttpStatus.FORBIDDEN
            )
        }

        try {
            await this.dwollaService.removeFundingSource(account)
            await this.plaidService.removeAccount(account)
            const allAccounts = await this.userAccountService.getAccountsForUser(request.user)

            return {
                user: await this.userService.serializeUser(request.user),
                userAccounts: await this.userAccountService.serializeAccounts(request.user, allAccounts)
            }
        } catch (e) {
            logError(this.logger, e)

            throw new InternalServerErrorException()
        }
    }

    private async linkAccountFromExistingInstitution(
        user: User,
        dto: LinkBankAccountDto,
        accountFromMatchingInstitution: UserAccount
    ): Promise<UserAccount> {
        const plaidAccountDto = dto.metaData.account
        const plaidAccount = await this.plaidService.getAccount(accountFromMatchingInstitution, plaidAccountDto)
        if (!plaidAccount) {
            throw new HttpException(
                `Unable to link account. The provided account matches an institution we've already linked but we were unable to find a matching account within that institution.`,
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        // Some of these details may not match. Plaid doesn't guarantee that account ids will be consistent for some reason.
        // Make sure that the DTO reflects the account we matched via the API.
        dto.metaData.account.mask = plaidAccount.mask
        dto.metaData.account.id = plaidAccount.account_id
        dto.metaData.account.subtype = plaidAccount.subtype
        dto.metaData.account.type = plaidAccount.type

        const newAccount = await this.userAccountService.updateOrCreateAccount(user, dto)
        return await this.userAccountService.saveAccessToken(
            newAccount,
            accountFromMatchingInstitution.plaidAccessToken,
            accountFromMatchingInstitution.plaidItemId
        )
    }

    private async linkAccountFromNewInstitution(user: User, dto: LinkBankAccountDto): Promise<UserAccount> {
        const patchedAccount = await this.userAccountService.updateOrCreateAccount(user, dto)

        return await this.plaidService.exchangePublicToken(patchedAccount)
    }
}
