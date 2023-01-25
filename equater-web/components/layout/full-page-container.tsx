import * as React from 'react'
import { BaseProps } from '../../types/BaseProps'

export function FullPageContainer(props: BaseProps) {
    return (
        <div className={`theme-dark bg-app-primary w-full pb-8 pt-8 ${props.className || ''}`} style={props.style}>
            {props.children}
        </div>
    )
}
