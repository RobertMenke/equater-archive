import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Post,
    Put,
    Query,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { DevelopmentGuard } from '../guards/dev/development.guard'
import { UserIdDto } from './user.dtos'
import { UserService } from './user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { DwollaIntegrationService } from './dwolla-integration.service'

@UseGuards(AuthenticationGuard, DevelopmentGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('api/dev/dwolla')
export class DwollaDevelopmentController {
    constructor(
        private readonly dwollaService: DwollaIntegrationService,
        private readonly userService: UserService,
        private readonly accountService: UserAccountService
    ) {}

    @Post('create-customer')
    async createCustomer(@Body() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })
        const updatedUser = await this.dwollaService.createOrUpdateCustomer(user)

        return {
            dwollaCustomerId: updatedUser.dwollaCustomerId
        }
    }

    @Put('funding-source')
    async createFundingSource(@Body() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })

        if (!user) {
            throw new HttpException(`User not found`, HttpStatus.NOT_FOUND)
        }

        const account = await this.accountService.findOneWhere({ userId: user.id, isActive: true })

        if (!account) {
            throw new HttpException(`Active account not found`, HttpStatus.NOT_FOUND)
        }

        const updatedAccount = await this.dwollaService.createFundingSource(user, account)

        return {
            fundingSourceId: updatedAccount.dwollaFundingSourceUrl
        }
    }

    @Get('customer')
    async getCustomer(@Query() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })

        return await this.dwollaService.getCustomer(user)
    }

    @Get('customer-balance')
    async getCustomerBalance(@Query() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })

        return await this.dwollaService.getCustomerBalance(user)
    }

    @Get('funding-source')
    async getFundingSource(@Query() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })
        const account = await this.accountService.findOneWhere({ userId: user.id, isActive: true })

        return await this.dwollaService.getFundingSource(account)
    }

    @Get('funding-sources')
    async getFundingSources(@Query() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })

        return await this.dwollaService.getFundingSources(user)
    }

    @Get('transfers')
    async getTransfers(@Query() dto: UserIdDto) {
        const user = await this.userService.findOneWhere({ id: dto.userId })

        return await this.dwollaService.getTransfers(user)
    }
}
