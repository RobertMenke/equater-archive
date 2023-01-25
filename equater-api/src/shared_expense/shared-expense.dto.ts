import { ExpenseContributionType } from './shared-expense-user-agreement.entity'

export interface ExpenseContribution {
    // Can be null in the case where ExpenseContributionType.SPLIT_EVENLY is selected
    contributionValue?: number
    contributionType: ExpenseContributionType
}
