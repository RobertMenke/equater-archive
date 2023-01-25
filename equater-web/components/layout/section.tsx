import { default as React } from 'react'
import { BaseProps } from '../../types/BaseProps'
import { CircularSpinner } from '../feedback/CircularSpinner'

interface Props extends BaseProps {
    title: string
    subtitle?: string
    rightAlignedAction?: React.ReactElement
}

export function Section(props: Props) {
    return (
        <section className={`theme-dark bg-app-secondary flex flex-col rounded md:p-2 mb-6`}>
            <div className={`flex justify-between border-app-primary mx-2 md:mx-4 pb-2 pt-4`}>
                <div className={'md:w-8/12'}>
                    <h3 className={'text-2xl text-gray-300 font-bold '}>{props.title}</h3>
                    {props.subtitle && <span className={'flex text-md text-gray-500 pt-2'}>{props.subtitle}</span>}
                </div>
                {props.rightAlignedAction && props.rightAlignedAction}
            </div>
            <div className={'px-2 md:px-4 pb-4 pt-2'}>{props.children}</div>
        </section>
    )
}

export function LoadingSection() {
    return (
        <div className={'flex justify-center items-center p-32'}>
            <CircularSpinner />
        </div>
    )
}
