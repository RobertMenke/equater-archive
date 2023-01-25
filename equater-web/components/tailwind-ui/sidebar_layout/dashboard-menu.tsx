import * as React from 'react'
import { SvgLogoFullUppercase } from '../../svg/LogoFullUppercase'
import { NavList } from './nav-list'

interface Props {
    setSidebarIsOpen: (isOpen: boolean) => void
}

export function DashboardMenu(props: Props) {
    return (
        <div className="hidden md:flex md:flex-shrink-0 theme-dark" style={{ borderRight: '1px solid #000' }}>
            <div className="flex flex-col w-62">
                <div className="flex items-center h-16 flex-shrink-0 px-4 theme-dark bg-app-primary">
                    <SvgLogoFullUppercase width={180} height={50} />
                </div>
                <div className="h-0 flex-1 flex flex-col overflow-y-auto">
                    {/*Sidebar component, swap this element with another sidebar if you like*/}
                    <nav className="flex-1 px-4 py-4 theme-dark bg-app-primary">
                        <NavList setSidebarIsOpen={props.setSidebarIsOpen} />
                    </nav>
                </div>
            </div>
        </div>
    )
}
