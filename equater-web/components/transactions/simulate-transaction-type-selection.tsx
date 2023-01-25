import { useState } from 'react'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../redux/config'
import { setTransactionSimulationStep, SimulateTransactionStep } from '../../redux/slices/simulate-transaction.slice'
import RadioGroupListWithDescription, { RadioOption } from '../input/RadioGroup'
import { Button, ButtonRole } from '../tailwind-ui/input/button'

enum SimulationType {
    USING_EXISTING_AGREEMENT,
    USING_TEXT_INPUT
}

const radioOptions: RadioOption<SimulationType>[] = [
    {
        id: SimulationType.USING_EXISTING_AGREEMENT,
        name: 'Simulate transaction based on existing agreement',
        description: "Choose from a user's existing active agreements to trigger a transaction"
    },
    {
        id: SimulationType.USING_TEXT_INPUT,
        name: 'Manually enter a transaction name',
        description: 'Input any transaction name, merchant name, account, and amount for a transaction'
    }
]

export function SimulateTransactionTypeSelection() {
    const dispatch: AppDispatch = useDispatch()
    const [selectedRadioOption, setSelectedRadioOption] = useState(radioOptions[0])

    return (
        <div className={'flex flex-col w-12/12 pt-4'}>
            <RadioGroupListWithDescription
                label={'Sample'}
                options={radioOptions}
                selected={selectedRadioOption}
                setSelected={setSelectedRadioOption}
            />
            <Button
                className={'py-8'}
                text={'Next Step'}
                isLoading={false}
                role={ButtonRole.PRIMARY}
                onClick={() => {
                    switch (selectedRadioOption.id) {
                        case SimulationType.USING_EXISTING_AGREEMENT:
                            dispatch(setTransactionSimulationStep(SimulateTransactionStep.SELECT_SHARED_EXPENSE))
                            break
                        case SimulationType.USING_TEXT_INPUT:
                            dispatch(setTransactionSimulationStep(SimulateTransactionStep.ADD_TRANSACTION_DETAIL))
                            break
                    }
                }}
            />
        </div>
    )
}
