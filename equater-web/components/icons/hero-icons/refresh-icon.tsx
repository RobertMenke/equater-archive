import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    strokeColor: string
}

export function RefreshIcon(props: Props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${props.className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke={props.strokeColor}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke={props.strokeColor}
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
        </svg>
    )
}
