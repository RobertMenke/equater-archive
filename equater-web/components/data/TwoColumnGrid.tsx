import * as React from 'react'
import { BaseProps } from '../../types/BaseProps'

interface GridElement {
    key: string | JSX.Element
    value: string | JSX.Element
}

interface Props extends BaseProps {
    data: GridElement[]
}

export function TwoColumnGrid(props: Props) {
    return (
        <div className={`bg-app-secondary overflow-hidden ${props.className ? props.className : ''}`}>
            <div className="border-t border-gray-800 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-800">
                    {props.data.map((element, i) => (
                        <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">{element.key}</dt>
                            <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">{element.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    )
}
