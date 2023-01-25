/* This example requires Tailwind CSS v2.0+ */
import { Fragment, Key, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'
import { classNames } from '../../utils/dom.utils'

export interface ComboBoxValue {
    id: Key // string|number
    primaryText: string
    secondaryText?: string
}

interface Props {
    label: string
    values: ComboBoxValue[]
    setSelectedValue: (id: Key) => void | Promise<void>
}

export function ComboBox(props: Props) {
    const [selected, setSelected] = useState<ComboBoxValue | null>(null)

    return (
        <Listbox
            value={selected ? selected.id : null}
            onChange={(value) => {
                // @ts-ignore
                const comboBoxValue = props.values.find((item) => item.id === value)
                if (comboBoxValue) {
                    setSelected(comboBoxValue)
                    props.setSelectedValue(comboBoxValue.id)
                }
            }}
        >
            {({ open }) => (
                <>
                    <Listbox.Label className="block text-sm font-medium leading-5 text-gray-600">
                        {props.label}
                    </Listbox.Label>
                    <div className="mt-1 relative">
                        <Listbox.Button className="relative w-full bg-app-primary border border-app-primary rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <span className="w-full inline-flex truncate">
                                <span className="truncate text-primary">
                                    {selected ? selected.primaryText : 'Select a value'}
                                </span>
                                <span className="ml-2 truncate text-gray-600">
                                    {selected && selected.secondaryText ? selected.secondaryText : ''}
                                </span>
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options
                                static
                                className="absolute z-10 mt-1 w-full bg-app-primary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                            >
                                {props.values.map((value) => (
                                    <Listbox.Option
                                        key={value.id}
                                        className={({ active }) =>
                                            classNames(
                                                active ? 'text-white bg-app-accent' : 'text-gray-900',
                                                'cursor-default select-none relative py-2 pl-3 pr-9'
                                            )
                                        }
                                        value={value.id}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className="flex">
                                                    <span
                                                        className={classNames(
                                                            selected ? 'font-semibold' : 'font-normal',
                                                            'truncate text-primary'
                                                        )}
                                                    >
                                                        {value.primaryText}
                                                    </span>
                                                    {value.secondaryText && (
                                                        <span
                                                            className={classNames(
                                                                active ? 'text-indigo-200' : 'text-gray-500',
                                                                'ml-2 truncate text-gray-600'
                                                            )}
                                                        >
                                                            {value.secondaryText}
                                                        </span>
                                                    )}
                                                </div>

                                                {selected ? (
                                                    <span
                                                        className={classNames(
                                                            active ? 'text-white' : 'text-accent-primary',
                                                            'absolute inset-y-0 right-0 flex items-center pr-4'
                                                        )}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </>
            )}
        </Listbox>
    )
}
