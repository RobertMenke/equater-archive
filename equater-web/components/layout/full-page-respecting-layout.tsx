import * as React from 'react'
import { BaseProps } from '../../types/BaseProps'

export function FullPageRespectingLayout(props: BaseProps) {
    return (
        <div
            className={`theme-dark bg-app-primary w-full full-page-within-layout flex flex-col ${props.className ||
                ''}`}
            style={props.style}
        >
            {props.children}
        </div>
    )
}
