import { RadioGroup } from '@headlessui/react'
import { classNames } from '../../utils/dom.utils'

export interface RadioOption<Id> {
    id: Id
    name: string
    description: string
}

interface Props<RadioOptionId> {
    label: string
    options: RadioOption<RadioOptionId>[]
    selected: RadioOption<RadioOptionId>
    setSelected: (option: RadioOption<RadioOptionId>) => void
}

// https://tailwindui.com/components/application-ui/forms/radio-groups
export default function RadioGroupListWithDescription<RadioOptionId>(props: Props<RadioOptionId>) {
    return (
        <RadioGroup value={props.selected} onChange={props.setSelected}>
            <RadioGroup.Label className="sr-only">{props.label}</RadioGroup.Label>
            <div className="rounded-md -space-y-px">
                {props.options.map((option, optionIndex) => (
                    <RadioGroup.Option
                        key={option.name}
                        value={option}
                        className={({ checked }) =>
                            classNames(
                                optionIndex === 0 ? 'rounded-tl-md rounded-tr-md' : '',
                                optionIndex === props.options.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
                                checked ? 'bg-app-secondary-dark border-app-primary z-10' : 'border-app-primary',
                                'relative border p-4 flex cursor-pointer focus:outline-none'
                            )
                        }
                    >
                        {({ active, checked }) => (
                            <>
                                <span
                                    className={classNames(
                                        checked ? 'bg-app-accent border-transparent' : 'bg-white border-gray-300',
                                        active ? 'ring-2 ring-offset-2 ring-app-accent' : '',
                                        'h-4 w-4 mt-0.5 cursor-pointer rounded-full border flex items-center justify-center'
                                    )}
                                    aria-hidden="true"
                                >
                                    <span className="rounded-full bg-white w-1.5 h-1.5" />
                                </span>
                                <div className="ml-3 flex flex-col">
                                    <RadioGroup.Label
                                        as="span"
                                        className={classNames('block text-sm font-medium text-primary')}
                                    >
                                        {option.name}
                                    </RadioGroup.Label>
                                    <RadioGroup.Description
                                        as="span"
                                        className={classNames('block text-sm text-secondary')}
                                    >
                                        {option.description}
                                    </RadioGroup.Description>
                                </div>
                            </>
                        )}
                    </RadioGroup.Option>
                ))}
            </div>
        </RadioGroup>
    )
}
