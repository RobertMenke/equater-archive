import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Put,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { AdminOrSelfGuard } from '../guards/auth/admin-or-self.guard'
import { AuthenticatedRequest, AuthenticationGuard } from '../guards/auth/authentication.guard'
import { EmailConfirmationGuard } from '../guards/auth/email-confirmation.guard'
import { PlaidSupportedAccountType } from '../plaid/plaid.service'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService, SharedExpenseStory } from '../shared_expense/shared-expense.service'
import { SocketEvent } from '../socket/socket.event'
import { VendorService } from '../transaction/vendor.service'
import { ConfirmRelationshipEvent } from '../user/events/confirm-relationship.event'
import { CreateRelationshipEvent } from '../user/events/create-relationship.event'
import { Role, User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { UserAccountService } from '../user_account/user-account.service'
import { BinaryStatus, logError, mapAsync, mapAsyncSequential } from '../utils/data.utils'
import {
    CreateRecurringSharedExpenseDto,
    CreateSharedBillDto,
    ExpenseSharingAgreementDto,
    ItemStatusDto,
    UserAgreementDto
} from './expense-api.dto'
import { ExpenseApiService } from './expense-api.service'

@Controller('api/expense')
@UseGuards(AuthenticationGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class ExpenseApiController {
    private readonly logger = new Logger(ExpenseApiController.name)

    constructor(
        private readonly userService: UserService,
        private readonly accountService: UserAccountService,
        private readonly expenseService: SharedExpenseService,
        private readonly vendorService: VendorService,
        private readonly expenseApiService: ExpenseApiService,
        private readonly eventBus: EventBus
    ) {}

    @UseGuards(EmailConfirmationGuard)
    @Put('shared-bill')
    async createVendorWebHookSharedExpense(@Req() request: AuthenticatedRequest, @Body() dto: CreateSharedBillDto) {
        const user: User = request.user
        const vendor = await this.vendorService.findUniqueVendorBy({ id: dto.uniqueVendorId })

        if (!vendor) {
            throw new HttpException('Invalid vendor selection', HttpStatus.NOT_FOUND)
        }

        const hasExistingAgreement = await this.expenseService.userHasActiveExpenseAgreementForVendor(user, vendor)

        if (hasExistingAgreement) {
            throw new HttpException(
                'You already have an active expense sharing agreement for this vendor',
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        const destinationAccount = await this.accountService.findOneWhere({ id: dto.expenseOwnerDestinationAccountId })

        if (!destinationAccount || destinationAccount.accountType !== PlaidSupportedAccountType.DEPOSITORY) {
            throw new HttpException(
                `Shared bills must specify a depository account for payment`,
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        const sharedExpense = await this.expenseService.createSharedBill(user, vendor, dto)
        await this.vendorService.incrementTotalAgreements(vendor)
        const story = await this.createSharedExpense(user, sharedExpense, dto)
        const serializedStory = await this.expenseService.serializeSharedExpenseStory(story)
        await this.expenseService.sendAgreementSocketUpdate(
            sharedExpense,
            SocketEvent.AGREEMENT_CREATED,
            serializedStory
        )

        return serializedStory
    }

    @UseGuards(EmailConfirmationGuard)
    @Put('recurring-payment')
    async createRecurringDateSharedExpense(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreateRecurringSharedExpenseDto
    ) {
        const user: User = request.user
        const account = await this.accountService.findOneWhere({ id: dto.expenseOwnerDestinationAccountId })

        if (!account) {
            throw new HttpException(`Must supply a valid account`, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const destinationAccount = await this.accountService.findOneWhere({ id: dto.expenseOwnerDestinationAccountId })

        if (!destinationAccount || destinationAccount.accountType !== PlaidSupportedAccountType.DEPOSITORY) {
            throw new HttpException(
                `Shared bills must specify a depository account for payment`,
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        const sharedExpense = await this.expenseService.createRecurringDateAgreement(user, dto)
        const story = await this.createSharedExpense(user, sharedExpense, dto)
        const serializedStory = await this.expenseService.serializeSharedExpenseStory(story)
        await this.expenseService.sendAgreementSocketUpdate(
            sharedExpense,
            SocketEvent.AGREEMENT_CREATED,
            serializedStory
        )

        return serializedStory
    }

    @UseGuards(EmailConfirmationGuard)
    @Patch('deactivate/:sharedExpenseId')
    async deactivateSharedExpense(
        @Param('sharedExpenseId') sharedExpenseId: number,
        @Req() request: AuthenticatedRequest
    ) {
        const user: User = request.user
        const expense = await this.expenseService.findSharedExpenseBy({ id: sharedExpenseId })

        if (!expense) {
            throw new HttpException('Shared expense was not found', HttpStatus.NOT_FOUND)
        }

        const expenseUser = await expense.user

        if (expenseUser.id !== user.id) {
            throw new HttpException("You're not allowed to directly edit this shared expense", HttpStatus.FORBIDDEN)
        }

        const agreements = await expense.userAgreements
        await mapAsyncSequential(agreements, (agreement) =>
            this.expenseService.setUserAgreementStatus(agreement, BinaryStatus.IS_INACTIVE)
        )

        const updatedSharedExpense = await this.expenseService.setSharedExpenseStatus(expense, BinaryStatus.IS_INACTIVE)
        const story = await this.expenseService.getSharedExpenseStory(updatedSharedExpense)
        const serializedStory = await this.expenseService.serializeSharedExpenseStory(story)
        await this.expenseService.sendAgreementSocketUpdate(expense, SocketEvent.AGREEMENT_UPDATED, serializedStory)
        await this.expenseApiService.sendExpenseCancellationNotices(expense, user)

        return serializedStory
    }

    @UseGuards(EmailConfirmationGuard)
    @Patch('agreement')
    async acceptOrDeclineSharedExpenseUserAgreement(
        @Req() request: AuthenticatedRequest,
        @Body() dto: UserAgreementDto
    ) {
        const user: User = request.user
        const agreement = await this.expenseService.findAgreementBy({ id: dto.userAgreementId })

        if (!agreement) {
            throw new HttpException('Agreement not found', HttpStatus.NOT_FOUND)
        }

        const agreementUser = await agreement.user

        if (agreementUser.id !== user.id) {
            throw new HttpException("You're not allowed to modify this agreement", HttpStatus.FORBIDDEN)
        }

        if (dto.doesAcceptAgreement && !dto.paymentAccountId) {
            throw new HttpException(
                `Must provide a payment account when accepting an agreement`,
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        // Set the status of the agreement
        const status = dto.doesAcceptAgreement ? BinaryStatus.IS_ACTIVE : BinaryStatus.IS_INACTIVE
        const modifiedAgreement = await this.expenseService.setUserAgreementStatus(agreement, status)

        // Notify the expense owner of the agreement's status change
        const expense = await modifiedAgreement.sharedExpense

        // Confirm the relationship status of the 2 parties involved if the agreement has been accepted (if not, don't set isConfirmed to false)
        if (dto.doesAcceptAgreement) {
            this.eventBus.publish(
                new ConfirmRelationshipEvent(await expense.user, [agreementUser], BinaryStatus.IS_ACTIVE)
            )

            await this.expenseService.setAgreementPaymentAccount(modifiedAgreement, dto.paymentAccountId)
        }

        // Determine if the overall status of the shared expense should change
        const agreements = await this.expenseService.getUserAgreements(expense)
        const allAgreementsAreActive = agreements.every((item) => item.isActive)
        const pendingInvites = await this.expenseApiService.findPendingUserInvitesForExpense(expense)

        await this.expenseApiService.sendAgreementStatusNotification(expense, agreements, user)

        // When all agreements become active a shared expense is made active
        if (allAgreementsAreActive && pendingInvites.length === 0) {
            const activeSharedExpense = await this.expenseService.setSharedExpenseStatus(
                expense,
                BinaryStatus.IS_ACTIVE
            )
            await this.expenseApiService.sendExpenseStatusNotification(activeSharedExpense, agreements, user)
        }

        // When all agreements are not active and an expense is active the shared expense is marked as inactive
        if (!dto.doesAcceptAgreement) {
            const inactiveSharedExpense = await this.expenseService.setSharedExpenseStatus(
                expense,
                BinaryStatus.IS_INACTIVE
            )
            await this.expenseApiService.sendExpenseStatusNotification(inactiveSharedExpense, agreements, user)
        }

        const updatedExpense = await this.expenseService.findSharedExpenseBy({ id: expense.id })
        const story = await this.expenseService.getSharedExpenseStory(updatedExpense)
        const serializedStory = await this.expenseService.serializeSharedExpenseStory(story)
        await this.expenseService.sendAgreementSocketUpdate(expense, SocketEvent.AGREEMENT_UPDATED, serializedStory)

        return serializedStory
    }

    @Get('user/:userId')
    @UseGuards(new AdminOrSelfGuard('userId'))
    async getSharedExpensesRelevantToUser(
        @Req() request: AuthenticatedRequest,
        @Param('userId', new ParseIntPipe()) userId: number,
        @Query() params: ItemStatusDto
    ) {
        const user: User = await this.userService.findOneWhere({ id: userId })
        const expenses = await this.expenseService.getSharedExpensesForUser(user, params)
        const stories = await mapAsync(expenses, (expense) => this.expenseService.getSharedExpenseStory(expense))

        return await mapAsync(stories, (story) => this.expenseService.serializeSharedExpenseStory(story))
    }

    @Get('user/agreements/:userId')
    @UseGuards(new AdminOrSelfGuard('userId'))
    async getSharedExpenseAgreementsForUser(
        @Req() request: AuthenticatedRequest,
        @Param('userId', new ParseIntPipe()) userId: number,
        @Query() params: ItemStatusDto
    ) {
        const user = await this.userService.findOneWhere({ id: userId })
        const agreements = await this.expenseService.getSharedExpenseUserAgreements(user)
        const stories = await mapAsync(agreements, (agreement) => this.expenseService.getUserAgreementStory(agreement))

        return await mapAsync(stories, (story) => this.expenseService.serializeUserAgreementStory(story))
    }

    @Get('user/transactions/:userId')
    @UseGuards(new AdminOrSelfGuard('userId'))
    async getSharedExpenseTransactionHistoryForUser(
        @Req() request: AuthenticatedRequest,
        @Param('userId', new ParseIntPipe()) userId: number
    ) {
        const user = await this.userService.findOneWhere({ id: userId })
        const transactions = await this.expenseService.getTransactions(user)

        return await mapAsync(transactions, (transaction) => this.expenseService.serializeTransactionStory(transaction))
    }

    @Get('transaction/:id')
    async getTransaction(@Req() request: AuthenticatedRequest, @Param('id', new ParseIntPipe()) id: number) {
        const transaction = await this.expenseService.findTransactionBy({ id })

        if (!transaction) {
            throw new NotFoundException()
        }

        if (
            request.user.role !== Role.ADMIN &&
            request.user.id !== transaction.sourceUserId &&
            request.user.id !== transaction.destinationUserId
        ) {
            throw new NotFoundException()
        }

        const story = await this.expenseService.getTransactionStory(transaction)

        return await this.expenseService.serializeTransactionStory(story)
    }

    @Get('agreement/:id')
    async getAgreement(@Req() request: AuthenticatedRequest, @Param('id', new ParseIntPipe()) id: number) {
        const agreement = await this.expenseService.findAgreementBy({ id })

        if (!agreement) {
            throw new NotFoundException()
        }

        const sharedExpense = await agreement.sharedExpense
        const expenseOwnerUserId = sharedExpense.expenseOwnerUserId
        const payeeUserId = agreement.userId

        if (
            request.user.role !== Role.ADMIN &&
            request.user.id !== payeeUserId &&
            request.user.id !== expenseOwnerUserId
        ) {
            throw new NotFoundException()
        }

        const story = await this.expenseService.getUserAgreementStory(agreement)

        return await this.expenseService.serializeUserAgreementStory(story)
    }

    @Get(':sharedExpenseId')
    async getSharedExpense(
        @Req() request: AuthenticatedRequest,
        @Param('sharedExpenseId', new ParseIntPipe()) id: number
    ) {
        const expense = await this.expenseService.findSharedExpenseBy({ id })

        if (!expense) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND)
        }

        return expense
    }

    /**
     * Both types of shared expenses have this business logic in common
     *
     * @param user
     * @param sharedExpense
     * @param dto
     */
    private async createSharedExpense(
        user: User,
        sharedExpense: SharedExpense,
        dto: ExpenseSharingAgreementDto
    ): Promise<SharedExpenseStory> {
        const userAgreements = await this.expenseApiService.createSharedExpenseUserAgreements(sharedExpense, dto)
        const userInvites = await this.expenseApiService.sendUserInvites(user, sharedExpense, dto)

        // Send out notifications
        await mapAsync(userAgreements, (agreement) =>
            this.expenseApiService
                .notifyPayeeOfExpenseAgreementCreation(sharedExpense, agreement)
                .catch((e) => logError(this.logger, e))
        )

        await mapAsync(userInvites, (invite) =>
            this.expenseApiService
                .notifyProspectiveUserOfExpenseAgreementCreation(sharedExpense, invite)
                .catch((e) => logError(this.logger, e))
        )

        // Note this should be basically instantaneous because we've already queried this relationship sending out notifications
        const users = await mapAsync(userAgreements, (agreement) => agreement.user)
        // See: CreateRelationshipHandler - creates or finds relationships
        this.eventBus.publish(new CreateRelationshipEvent(user, users))

        return await this.expenseService.getSharedExpenseStory(sharedExpense)
    }
}
