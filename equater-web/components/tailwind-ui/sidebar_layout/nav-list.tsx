import { ClockIcon } from '@heroicons/react/24/outline'
import * as React from 'react'
import { TEXT_COLOR } from '../../../constants/colors'
import { CodeIcon } from '../../icons/hero-icons/code-icon'
import { HomeIcon } from '../../icons/hero-icons/home-icon'
import { SwitchHorizontal } from '../../icons/hero-icons/switch-horizontal'
import { UserGroupIcon } from '../../icons/hero-icons/UserGroup'
import { NavItem } from './nav-item'

interface Props {
    setSidebarIsOpen: (isOpen: boolean) => void
}
export function NavList(props: Props) {
    // This is only for mobile
    function handleClick() {
        props.setSidebarIsOpen(false)
    }

    return (
        <>
            <NavItem
                icon={<HomeIcon />}
                title={'Dashboard'}
                link={'/dashboard'}
                isActive={(pathName, link) => pathName === link}
                onClick={handleClick}
            />
            <NavItem
                icon={<UserGroupIcon strokeColor={TEXT_COLOR} />}
                title={'Users'}
                link={'/dashboard/users'}
                isActive={(pathName, link) => {
                    console.log(pathName, link)
                    return pathName.includes(link)
                }}
                onClick={handleClick}
            />
            <NavItem
                icon={<ClockIcon className={'h-6 w-6'} style={{ color: TEXT_COLOR }} />}
                title={'Watchlist'}
                link={'/dashboard/watchlist'}
                isActive={(pathName, link) => {
                    console.log(pathName, link)
                    return pathName.includes(link)
                }}
                onClick={handleClick}
            />
            <NavItem
                icon={<SwitchHorizontal />}
                title={'Vendors'}
                link={'/dashboard/vendors'}
                isActive={(pathName, link) => {
                    console.log(pathName, link)
                    return pathName.includes(link)
                }}
                onClick={handleClick}
            />
            {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && (
                <NavItem
                    icon={<CodeIcon />}
                    title={'Dev'}
                    link={'/dashboard/dev'}
                    isActive={(pathName, link) => pathName.includes(link)}
                    onClick={handleClick}
                />
            )}
        </>
    )
}
