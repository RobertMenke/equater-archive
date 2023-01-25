import { ReactElement } from 'react'
import * as React from 'react'
import { BaseProps } from '../../types/BaseProps'
import { ArrowRightBold } from '../icons/shape-so/arrow-right-bold'
import { Link } from 'react-router-dom'

interface Props extends BaseProps {
    href: string
    icon: ReactElement
    title: string
    subtext: string
}

export function DashboardLargeLink(props: Props) {
    return (
        <Link
            to={props.href}
            className={`theme-dark w-full bg-app-primary hover:bg-app-secondary cursor-pointer flex flex-row rounded justify-between items-center my-2 mx-2`}
        >
            <div className={`flex flex-row justify-start items-center`}>
                <div className={`flex flex-col relative items-center justify-center px-2`}>{props.icon}</div>

                <div className={`flex flex-col items-start p-4`}>
                    <span className={`text-gray-400 font-bold text-md`}>{props.title}</span>
                    <span className={`text-gray-500 font-thin text-sm`}>{props.subtext}</span>
                </div>
            </div>
            <div className={`mr-4`}>
                <ArrowRightBold color={`#cbd5e0`} className={`h-24`} />
            </div>
        </Link>
    )
}
