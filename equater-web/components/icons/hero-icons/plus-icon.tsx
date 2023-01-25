import * as React from 'react'
import { SvgIconProps } from '../svg-icon-props'

export function PlusIcon(props: SvgIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${props.className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke={props.strokeColor}
        >
            <path
                stroke={props.strokeColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
        </svg>
    )
}
