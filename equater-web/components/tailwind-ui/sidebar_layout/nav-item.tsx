import { default as React, ReactNode } from 'react'
import { BaseProps } from '../../../types/BaseProps'
import { Link, useLocation } from 'react-router-dom'

interface Props extends BaseProps {
    icon: ReactNode
    title: string
    link: string
    isActive: (pathname: string, link: string) => boolean
    onClick: () => void | Promise<void>
}

export function NavItem(props: Props) {
    const { pathname } = useLocation()
    const isActive = props.isActive(pathname, props.link)
    const background = isActive ? 'theme-dark bg-app-secondary' : ''

    return (
        <div className={'relative py-8 md:py-0'} onClick={props.onClick}>
            <Link
                to={props.link}
                className={`${background} group flex items-center px-2 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:bg-app-secondary transition ease-in-out duration-150 hover:shadow-xl hover:bg-app-secondary`}
            >
                <div className={'flex flex-col relative items-center justify-center px-2 mr-2'}>{props.icon}</div>
                <span>{props.title}</span>
            </Link>
        </div>
    )
}
