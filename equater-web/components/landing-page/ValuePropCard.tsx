import { ReactNode } from 'react'
import * as React from 'react'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    icon: ReactNode
    title: string
    description: string
}

export function ValuePropCard(props: Props) {
    return (
        <div className={'value-prop-card flex flex-col theme-dark bg-app-secondary '}>
            {props.icon}
            <span className={'text-primary text-xl pt-4 pb-2 font-bold'}>{props.title}</span>
            <span className={'text-secondary'}>{props.description}</span>
        </div>
    )
}
