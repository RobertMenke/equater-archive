import * as React from 'react'

interface Props {
    id: string
    checked: boolean
    labelText: string
    descriptionText: string
    onChanged: (value: boolean) => void
}
export function CheckboxSection(props: Props) {
    return (
        <div className="mt-4">
            <div className="relative flex items-start">
                <div className="absolute flex items-center h-5">
                    <input
                        id={props.id}
                        onChange={() => {
                            props.onChanged(!props.checked)
                        }}
                        checked={props.checked}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-app-accent transition duration-150 ease-in-out"
                    />
                </div>
                <div className="pl-7 text-sm leading-5">
                    <label htmlFor={props.id} className="font-medium text-gray-300">
                        {props.labelText}
                    </label>
                    <p className="text-gray-500">{props.descriptionText}</p>
                </div>
            </div>
        </div>
    )
}
