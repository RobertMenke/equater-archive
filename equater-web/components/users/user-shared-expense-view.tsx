import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SharedExpenseStoryRow } from '../expense/shared-expense-story-row'
import { UserChip } from './user-chip'
import { AppDispatch, State } from '../../redux/config'
import {
    setSelectedSharedExpense,
    setTransactionSimulationStep,
    SimulateTransactionStep
} from '../../redux/slices/simulate-transaction.slice'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {}

export function UserSharedExpenseView(props: Props) {
    const { selectedUser, sharedExpenseSearchIsLoading, sharedExpenses } = useSelector(
        (state: State) => state.simulateTransaction
    )
    const dispatch: AppDispatch = useDispatch()

    if (!selectedUser) {
        return null
    }

    return (
        <div>
            <div className={'flex flex-row align-center justify-center'}>
                <UserChip user={selectedUser} />
            </div>
            {sharedExpenseSearchIsLoading && (
                <div>
                    <div className={'spinner p-6'} />
                </div>
            )}
            {sharedExpenses.map((expense) => (
                <SharedExpenseStoryRow
                    key={expense.sharedExpense.id}
                    story={expense}
                    onClick={() => {
                        dispatch(setTransactionSimulationStep(SimulateTransactionStep.REVIEW_SHARED_EXPENSE_SIMULATION))
                        dispatch(setSelectedSharedExpense(expense))
                    }}
                />
            ))}
        </div>
    )
}
