import * as React from 'react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { AppDispatch, State } from '../../redux/config'
import { UserAccount } from '../../redux/slices/auth.slice'
import { simulateArbitraryTransaction, SimulateTransactionState } from '../../redux/slices/simulate-transaction.slice'
import { ComboBox } from '../input/ComboBox'
import { Button, ButtonRole } from '../tailwind-ui/input/button'
import { TextField } from '../tailwind-ui/input/text-field'
import { UserChip } from '../users/user-chip'

interface Props {
    userAccounts: UserAccount[]
}

export function SimulateTransactionManualInput(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const { selectedUser } = useSelector<State, SimulateTransactionState>((state) => state.simulateTransaction)
    const [transactionName, setTransactionName] = useState('')
    const [merchantName, setMerchantName] = useState('')
    const [ppdId, setPpdId] = useState('')
    const [amount, setAmount] = useState('')
    const [accountId, setAccountId] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    if (!selectedUser) {
        return null
    }

    const comboBoxValues = props.userAccounts.map((account) => ({
        id: account.id,
        primaryText: account.accountName,
        secondaryText: `${account.institutionName} ${account.accountId}`
    }))

    return (
        <div className={'w-6/12 p-8'}>
            <div className={'flex flex-row align-center justify-start pb-8'}>
                <UserChip user={selectedUser} />
            </div>
            <ComboBox
                label={'Account'}
                values={comboBoxValues}
                setSelectedValue={(id) => {
                    setAccountId(`${id}`)
                }}
            />
            <TextField
                className={'pt-8'}
                label={'Transaction Name'}
                value={transactionName}
                handleChange={setTransactionName}
            />
            <TextField className={'pt-8'} label={'Merchant Name'} value={merchantName} handleChange={setMerchantName} />
            <TextField className={'pt-8'} label={'PPD ID (optional)'} value={ppdId} handleChange={setPpdId} />
            <TextField className={'py-8'} label={'Amount in dollars'} value={amount} handleChange={setAmount} />
            <Button
                text={'Simulate Transaction'}
                isLoading={isLoading}
                role={ButtonRole.PRIMARY}
                onClick={async () => {
                    const parsedAmount = parseFloat(amount)
                    const parsedPpdId = ppdId.trim().length > 0 ? ppdId : null
                    if (!accountId || transactionName.trim().length === 0 || isNaN(parsedAmount)) {
                        setTimeout(() => {
                            toast('Please fill out each field to simulate a transaction. PPD ID is optional.')
                        })

                        return
                    }

                    setIsLoading(true)
                    try {
                        await simulateArbitraryTransaction({
                            amount: parsedAmount,
                            transactionName,
                            merchantName,
                            ppdId: parsedPpdId,
                            accountId: parseInt(accountId, 10)
                        })
                        toast('Successfully simulated transaction')
                    } catch (e) {
                        console.error(e)
                        toast('Failed to simulate transaction')
                    }
                    setIsLoading(false)
                }}
            />
        </div>
    )
}
