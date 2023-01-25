import { useState } from 'react'
import * as React from 'react'

interface Props {
    toggleValue: boolean
    onToggle: (value: boolean) => void | Promise<void>
}

export function ShortToggle(props: Props) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <span
            onClick={() => {
                setIsFocused(false)
                props.onToggle(!props.toggleValue)
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="relative inline-flex items-center justify-center flex-no-shrink h-5 w-10 cursor-pointer focus:outline-none"
            role="checkbox"
            tabIndex={0}
            aria-checked={props.toggleValue}
        >
            <span
                aria-hidden="true"
                className={`${
                    props.toggleValue ? 'bg-indigo-600' : 'bg-gray-200'
                } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
            />
            <span
                aria-hidden="true"
                className={`${props.toggleValue ? 'translate-x-5' : 'translate-x-0'} ${
                    isFocused ? 'focused' : 'shadow-outline border-blue-300'
                } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform transition-transform ease-in-out duration-200`}
            />
        </span>
    )
}
