import axios from 'axios'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import { AppDispatch, State } from '../../../redux/config'
import { UserAccount } from '../../../redux/slices/auth.slice'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../../redux/slices/ops-navigation.slice'
import {
    fetchActiveUserAccounts,
    fetchSharedExpenses,
    setSelectedSharedExpense,
    setSelectedUser,
    setTransactionSimulationStep,
    SimulateTransactionStep
} from '../../../redux/slices/simulate-transaction.slice'
import Snackbar from '../../feedback/Snackbar'
import { Section } from '../../layout/section'
import { SimulateTransactionManualInput } from '../../transactions/simulate-transaction-manual-input'
import { SimulateTransactionTypeSelection } from '../../transactions/simulate-transaction-type-selection'
import { SimulateTransactionView } from '../../transactions/simulate-transaction-view'
import { UserSearchView } from '../../users/user-search-view'
import { UserSharedExpenseView } from '../../users/user-shared-expense-view'

export function DevDashboard() {
    const dispatch: AppDispatch = useDispatch()
    const { step, selectedUser, selectedSharedExpense } = useSelector((state: State) => state.simulateTransaction)
    const [accounts, setUserAccounts] = useState<UserAccount[]>([])

    useEffect(() => {
        dispatch(setTransactionSimulationStep(SimulateTransactionStep.SELECT_USER))
        dispatch(setSelectedUser(null))
        dispatch(setSelectedSharedExpense(null))
        dispatch(setOpsNavigationTitle('Simulate Transactions'))
        dispatch(setShowOpsBackButton(false))
        ReactTooltip.rebuild()
    }, [])

    function getSubtitle() {
        switch (step) {
            case SimulateTransactionStep.SELECT_USER:
                return 'Step 1: select a user'
            case SimulateTransactionStep.SELECT_TYPE_OF_SIMULATION:
                return 'Step 2: what type of simulation do you want to run?'
            case SimulateTransactionStep.SELECT_SHARED_EXPENSE:
                return 'Step 3: select an agreement'
            case SimulateTransactionStep.ADD_TRANSACTION_DETAIL:
                return 'Step 3: set up the transaction'
            case SimulateTransactionStep.REVIEW_SHARED_EXPENSE_SIMULATION:
                return 'Step 4: review'
        }
    }

    return (
        <>
            <div className={'mx-2 md:mx-8'}>
                <Section title={'Simulate a transaction'} subtitle={getSubtitle()}>
                    {step === SimulateTransactionStep.SELECT_USER && (
                        <UserSearchView
                            onUserSelected={(user) => {
                                // @ts-ignore
                                dispatch(setSelectedUser(user))
                                // @ts-ignore
                                dispatch(
                                    setTransactionSimulationStep(SimulateTransactionStep.SELECT_TYPE_OF_SIMULATION)
                                )
                                const cancelTokenSource = axios.CancelToken.source()
                                dispatch(fetchSharedExpenses(user, cancelTokenSource.token))
                                dispatch(fetchActiveUserAccounts(user.id, cancelTokenSource.token, setUserAccounts))
                            }}
                        />
                    )}
                    {step === SimulateTransactionStep.SELECT_TYPE_OF_SIMULATION && selectedUser && (
                        <SimulateTransactionTypeSelection />
                    )}
                    {step === SimulateTransactionStep.SELECT_SHARED_EXPENSE && selectedUser && (
                        <UserSharedExpenseView />
                    )}
                    {step === SimulateTransactionStep.ADD_TRANSACTION_DETAIL && selectedUser && (
                        <SimulateTransactionManualInput userAccounts={accounts} />
                    )}
                    {step === SimulateTransactionStep.REVIEW_SHARED_EXPENSE_SIMULATION &&
                        selectedUser &&
                        selectedSharedExpense && <SimulateTransactionView />}
                </Section>
            </div>
            <Snackbar />
        </>
    )
}
