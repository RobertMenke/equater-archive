import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { subDays } from 'date-fns'
import { MoreThan } from 'typeorm'
import { SharedExpenseService } from '../shared_expense/shared-expense.service'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorAssociationEvent } from './events/vendor-association.event'
import { SharedExpenseSettlementService } from './shared-expense-settlement.service'

@EventsHandler(VendorAssociationEvent)
export class VendorAssociationHandler implements IEventHandler<VendorAssociationEvent> {
    constructor(
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly transactionService: TransactionService,
        private readonly settlementService: SharedExpenseSettlementService
    ) {}

    static TRANSACTION_LOOK_BACK_CUTOFF_IN_DAYS = 30

    /**
     * If we've just made an association between vendors, like "TRG Management Group" and "Icon Central Apartment"
     * there may be transactions for TRG Management Group that the user really intended
     * to be shared with their "Icon Central Apartment" shared bill.
     *
     * Scenario:
     *     - I set up a shared bill for my apartment (Icon Central)
     *     - My apartment charges me, but the bill comes through as "TRG Management Group"
     *     - We then review the transaction and make the association between "Icon Central" and "TRG Management Group"
     *     - The expected behavior for the user would be that the "TRG Management Group" transaction gets processed as an "Icon Central" shared bill
     * Process:
     *      - Find existing transactions for each vendor within the last 30 days
     *      - For each transaction, check to see if there's an active shared bill for the newly associated vendor
     *      - If so, re-process the transaction, which should trigger a payment
     */
    async handle(event: VendorAssociationEvent) {
        const transactionsForVendor = await this.transactionService.findManyTransactionsBy({
            uniqueVendorId: event.uniqueVendor.id,
            dateTimeCaptured: MoreThan(
                subDays(new Date(), VendorAssociationHandler.TRANSACTION_LOOK_BACK_CUTOFF_IN_DAYS)
            )
        })

        const transactionsForAssociatedVendor = await this.transactionService.findManyTransactionsBy({
            uniqueVendorId: event.associatedUniqueVendor.id,
            dateTimeCaptured: MoreThan(
                subDays(new Date(), VendorAssociationHandler.TRANSACTION_LOOK_BACK_CUTOFF_IN_DAYS)
            )
        })

        await this.reconcileHistoricalAssociations(transactionsForVendor, event.associatedUniqueVendor)
        await this.reconcileHistoricalAssociations(transactionsForAssociatedVendor, event.uniqueVendor)
    }

    private async reconcileHistoricalAssociations(transactions: Transaction[], associatedVendor: UniqueVendor) {
        for (const transaction of transactions) {
            const account = await transaction.account
            const user = await account.user

            // Find out if there's an active shared bill for the newly associated vendor. If so, we need to settle up.
            const sharedExpense = await this.sharedExpenseService.findSharedExpenseBy({
                expenseOwnerUserId: user.id,
                uniqueVendorId: associatedVendor.id,
                isActive: true
            })

            if (!sharedExpense) {
                continue
            }

            // Check to see if this shared bill was already settled
            const settledTransactions = await this.sharedExpenseService.findManyTransactionsBy({
                plaidTransactionId: transaction.id
            })

            if (settledTransactions.length > 0) {
                continue
            }

            await this.settlementService.createTransactions(sharedExpense, transaction)
        }
    }
}
