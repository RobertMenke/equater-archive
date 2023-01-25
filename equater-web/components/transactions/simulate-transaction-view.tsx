import { FormEvent } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SharedExpenseStoryChip } from '../expense/shared-expense-story-chip'
import { Error } from '../feedback/error'
import { Button, ButtonRole } from '../tailwind-ui/input/button'
import { UserChip } from '../users/user-chip'
import { AppDispatch, State } from '../../redux/config'
import { setSimulatedAmount, simulateTransaction, setError } from '../../redux/slices/simulate-transaction.slice'
import { BaseProps } from '../../types/BaseProps'
import { SharedExpenseType } from '../../types/shared-expense'

interface Props extends BaseProps {}

export function SimulateTransactionView(props: Props) {
    const { selectedUser, selectedSharedExpense, simulatedSharedExpenseIsLoading, simulatedAmount, error } =
        useSelector((state: State) => state.simulateTransaction)
    const dispatch: AppDispatch = useDispatch()

    if (!selectedUser || !selectedSharedExpense) {
        return null
    }

    return (
        <div className={'flex flex-col items-center justify-center'}>
            <div className={'flex flex-row content-center justify-center space-x-8'}>
                <UserChip user={selectedUser} />
                <SharedExpenseStoryChip story={selectedSharedExpense} />
            </div>
            <div className={'flex flex-row content-center justify-center mt-8'} style={{ width: '830px' }}>
                {selectedSharedExpense.vendor && (
                    <input
                        type={'text'}
                        className={`theme-dark bg-app-primary flex-grow text-gray-500 pt-4 pb-4 pl-2 pr-4 mr-1 font-md placeholder-gray-500 rounded-md border-transparent`}
                        placeholder={'Enter the dollar amount of the transaction'}
                        autoFocus={true}
                        onChange={(event: FormEvent<HTMLInputElement>) => {
                            dispatch(setSimulatedAmount(event.currentTarget.value))
                            dispatch(setError(null))
                        }}
                        value={simulatedAmount}
                    />
                )}
                <Button
                    onClick={() => {
                        let value = 0
                        const type = selectedSharedExpense?.sharedExpense?.sharedExpenseType
                        if (type === SharedExpenseType.TRANSACTION_WEB_HOOK) {
                            value = parseFloat(simulatedAmount)
                            if (isNaN(value)) {
                                dispatch(setError('Please enter a valid dollar amount'))
                                return
                            }
                        }

                        if (selectedSharedExpense) {
                            dispatch(simulateTransaction(selectedSharedExpense.sharedExpense.id, value))
                        }
                    }}
                    text={'Simulate Transaction'}
                    isLoading={simulatedSharedExpenseIsLoading}
                    role={ButtonRole.PRIMARY}
                />
            </div>
            {error && (
                <div className={'m-4'}>
                    <Error message={error} />
                </div>
            )}
        </div>
    )
}
