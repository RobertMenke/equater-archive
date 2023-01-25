import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Logger,
    ParseIntPipe,
    Post,
    Query,
    Request,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { subDays } from 'date-fns'
import { AuthenticatedRequest, AuthenticationGuard } from '../guards/auth/authentication.guard'
import { Roles, RolesGuard } from '../guards/auth/roles.guard'
import { EnvironmentGuard, ServerEnvironment } from '../guards/dev/environment.guard'
import { PlaidCategoryService } from '../plaid_category/plaid-category.service'
import { UserAccountDto } from '../user/user.dtos'
import { Role } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { logError } from '../utils/data.utils'
import { PlaidCronService } from './plaid-cron.service'
import { PlaidLinkTokenService } from './plaid-link-token.service'
import { PlaidTokenType } from './plaid-token-type'
import { PlaidService } from './plaid.service'

@UseGuards(AuthenticationGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('api/dev/plaid')
export class PlaidDevelopmentController {
    private readonly logger = new Logger(PlaidDevelopmentController.name)

    constructor(
        private readonly plaidService: PlaidService,
        private readonly plaidLinkTokenService: PlaidLinkTokenService,
        private readonly plaidCategoryService: PlaidCategoryService,
        private readonly userAccountService: UserAccountService,
        private readonly userService: UserService
    ) {}

    @Post('/fire-webhook')
    @Roles(Role.ADMIN)
    @UseGuards(new EnvironmentGuard([ServerEnvironment.DEVELOPMENT, ServerEnvironment.STAGING]))
    async fireWebhook(@Request() request: AuthenticatedRequest, @Body() dto: UserAccountDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })
        await this.plaidService.fireWebhook(account)
    }

    @Get('access-token')
    @Roles(Role.ADMIN)
    async getAccessToken(
        @Request() request: AuthenticatedRequest,
        @Query('userId', new ParseIntPipe()) userId: number
    ) {
        const user = await this.userService.findOneWhere({ id: userId })

        return await this.plaidLinkTokenService.findForUser(user)
    }

    @Get('get-transactions')
    @Roles(Role.ADMIN)
    async getTransactionHistory(@Request() request: AuthenticatedRequest, @Body() dto: UserAccountDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })
        const date = subDays(new Date(), 29)
        return await this.plaidService.getTransactionHistory(account, date)
    }

    @Get('get-accounts')
    @Roles(Role.ADMIN)
    async getAccounts(@Request() request: AuthenticatedRequest, @Body() dto: UserAccountDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })

        return await this.plaidService.getAccounts(account)
    }

    @Get('get-routing')
    @Roles(Role.ADMIN)
    async getRoutingInfo(@Request() request: AuthenticatedRequest, @Body() dto: UserAccountDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })

        return await this.plaidService.getRoutingInfo(account)
    }

    @Get('get-categories')
    @Roles(Role.ADMIN)
    getCategories(@Request() request: AuthenticatedRequest) {
        return this.plaidService.getCategories()
    }

    @Post('sync-categories')
    @Roles(Role.ADMIN)
    async syncCategories() {
        const service = new PlaidCronService(this.plaidService, this.plaidCategoryService)
        await service.syncCategories()
    }

    @Post('reset-login')
    @Roles(Role.ADMIN)
    @UseGuards(new EnvironmentGuard([ServerEnvironment.DEVELOPMENT, ServerEnvironment.STAGING]))
    async logoutItem(@Body() dto: UserAccountDto) {
        try {
            const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })

            return this.plaidService.resetLogin(account)
        } catch (e) {
            logError(this.logger, e)
            throw e
        }
    }

    @Delete('item')
    @Roles(Role.ADMIN)
    async deleteItem(@Body() dto: UserAccountDto) {
        const account = await this.userAccountService.findOneWhere({ id: dto.userAccountId })

        await this.plaidService.removeItem(account)
    }

    @Get('link-token')
    @Roles(Role.ADMIN)
    async getLinkToken(
        @Query('userId', new ParseIntPipe()) userId: number,
        @Query('tokenType') tokenType: PlaidTokenType
    ) {
        const user = await this.userService.findOneWhere({ id: userId })
        const token = await this.plaidService.createLinkKitToken(user, tokenType)

        return { token }
    }
}
