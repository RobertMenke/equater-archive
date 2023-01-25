import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { Roles, RolesGuard } from '../guards/auth/roles.guard'
import { EnvironmentGuard, ServerEnvironment } from '../guards/dev/environment.guard'
import { SharedExpenseService, UserAgreementStory } from '../shared_expense/shared-expense.service'
import { VendorService } from '../transaction/vendor.service'
import { Role } from '../user/user.entity'
import { logError, mapAsync, removeDuplicates } from '../utils/data.utils'
import { SimulatedArbitraryTransactionDto, SimulatedTransactionDto } from './expense-api.dto'
import { TransactionSimulationService } from './transaction-simulation.service'

@Controller('api/expense/ops')
@UseGuards(AuthenticationGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class ExpenseApiOpsController {
    private readonly logger = new Logger(ExpenseApiOpsController.name)

    constructor(
        private readonly expenseService: SharedExpenseService,
        private readonly vendorService: VendorService,
        private readonly simulationService: TransactionSimulationService
    ) {}

    // There are 2 different categories of shared bills that we need to be
    // extra vigilant in serving
    //
    // 1: Shared bills that have yet to match a plaid transaction
    // 2: Shared bills that have yet to match a plaid transaction AND are based on a unique vendor
    //    we've never matched before
    //
    // This route will retrieve and categorize those agreements for our ops dashboard
    // so that we can do everything in our power to ensure that the shared billing agreement
    // is honored.
    //
    // Note: This route will be slow for large datasets and will require some database
    // structure updates to speed up.
    @Get('agreement-watchlist')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async getAgreementWatchlist(): Promise<AgreementWatchlist> {
        // Get a list of agreements that have never been matched to a transaction
        const agreementsWithNoTransaction = await this.expenseService.getSharedBillsWithNoTransactions()
        // Get the related shared expenses, since the SharedExpense entity contain vendor info
        const sharedExpenses = await mapAsync(
            agreementsWithNoTransaction,
            async (agreement) => await agreement.sharedExpense
        )
        // From this list, find vendors that have never been matched to a transaction before
        const vendorIds = removeDuplicates(sharedExpenses.map((expense) => expense.uniqueVendorId))
        const vendorsWithTransactions =
            await this.vendorService.getVendorsFromListThatHaveBeenMatchedInSharedBillingTransactions(vendorIds)
        const vendorIdsWithTransactions = vendorsWithTransactions.map((vendor) => vendor.id)
        // Group the expenses/agreements that are related to a vendor that has never been successfully matched
        const newExpensesWithNewVendors = sharedExpenses.filter(
            (expense) => !vendorIdsWithTransactions.includes(expense.uniqueVendorId)
        )
        const newExpenseIdsWithNewVendors = newExpensesWithNewVendors.map((expense) => expense.id)

        // Group these agreements based on whether or not the associated vendor has ever been matched
        // to a shared expense successfully
        let newAgreementsWithNewVendors = []
        let newAgreements = []
        for (const agreement of agreementsWithNoTransaction) {
            const story = await this.expenseService.getUserAgreementStory(agreement)
            const serializedStory = await this.expenseService.serializeUserAgreementStory(story)
            if (newExpenseIdsWithNewVendors.includes(agreement.sharedExpenseId)) {
                newAgreementsWithNewVendors.push(serializedStory)
            } else {
                newAgreements.push(serializedStory)
            }
        }

        return {
            newAgreements,
            newAgreementsWithNewVendors
        }
    }

    // Simulates a transaction with an account id, transaction name, and an amount in dollars
    @Put('transaction/simulate')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, new EnvironmentGuard([ServerEnvironment.DEVELOPMENT, ServerEnvironment.STAGING]))
    async simulateTransaction(@Body() dto: SimulatedArbitraryTransactionDto) {
        try {
            await this.simulationService.simulateArbitraryTransaction(dto)
        } catch (e) {
            logError(this.logger, e)
            throw new HttpException(`Failed to simulate arbitrary transaction`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /**
     * This should only ever be used as a development tool
     *
     * @param request
     * @param id
     * @param dto
     */
    @Post(':sharedExpenseId/simulate')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, new EnvironmentGuard([ServerEnvironment.DEVELOPMENT, ServerEnvironment.STAGING]))
    async simulateSharedExpense(
        @Req() request,
        @Param('sharedExpenseId', new ParseIntPipe()) id: number,
        @Body() dto: SimulatedTransactionDto
    ) {
        const expense = await this.expenseService.findSharedExpenseBy({ id })

        if (!expense) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND)
        }

        await this.simulationService.simulateTransaction(expense, dto.amount)
    }
}

export interface AgreementWatchlist {
    newAgreements: UserAgreementStory[]
    newAgreementsWithNewVendors: UserAgreementStory[]
}
