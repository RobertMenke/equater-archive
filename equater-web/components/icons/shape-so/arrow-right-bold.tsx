import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    color: string
}

// This icon is from shape.so
export function ArrowRightBold(props: Props) {
    return (
        <svg className={`shape-so-svg ${props.className}`} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" fill="none" rx="0" ry="0" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.7049 11.2925L9.70494 5.2925C9.31494 4.9025 8.68494 4.9025 8.29494 5.2925C7.90494 5.6825 7.90494 6.3125 8.29494 6.7025L13.5849 12.0025L8.29494 17.2925C7.90494 17.6825 7.90494 18.3125 8.29494 18.7025C8.48494 18.9025 8.73494 19.0025 8.99494 19.0025C9.25494 19.0025 9.50494 18.9025 9.70494 18.7125L15.7049 12.7125C16.0949 12.3225 16.0949 11.6825 15.7049 11.2925Z"
                fill={props.color}
            />
        </svg>
    )
}
