import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Param,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { Roles, RolesGuard } from '../guards/auth/roles.guard'
import { Role } from '../user/user.entity'
import { TransactionService } from './transaction.service'

@UseGuards(AuthenticationGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get('vendor/:id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getTransactionsForVendor(@Param('id') uniqueVendorId: number) {
        const transactions = await this.transactionService.findManyTransactionsBy({
            uniqueVendorId: uniqueVendorId
        })

        return await this.transactionService.serializeTransactionsWithContext(transactions)
    }
}
