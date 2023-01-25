import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    additionalClassNames: string | null
}

export function StoreIcon(props: Props) {
    const additionalClassNames = props.additionalClassNames || ''
    return (
        <svg
            className={`mr-3 h-6 w-6 text-gray-300 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150 ${additionalClassNames}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
            />
        </svg>
    )
}
