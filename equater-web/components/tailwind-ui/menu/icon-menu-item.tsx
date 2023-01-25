import { ReactElement } from 'react'
import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'
import { CircularSpinner } from '../../feedback/CircularSpinner'

interface Props extends BaseProps {
    icon: ReactElement
    text: string
    isLoading: boolean
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export function IconMenuItem(props: Props) {
    return (
        <div
            onClick={props.onClick}
            className={`flex flex-row justify-start items-center pt-6 pb-6 cursor:pointer ${
                props.className && props.className
            }`}
        >
            <div className={'pl-4'}>{props.isLoading ? <CircularSpinner /> : props.icon}</div>
            <div className={'pl-4 pr-4 text-primary'}>
                <span>{props.text}</span>
            </div>
        </div>
    )
}
