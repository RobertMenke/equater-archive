import { ClockIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import { TEXT_COLOR } from '../../constants/colors'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { DashboardLargeLink } from '../dashboard/DashboardLinkLarge'
import { CodeIcon } from '../icons/hero-icons/code-icon'
import { SwitchHorizontal } from '../icons/hero-icons/switch-horizontal'
import { AppDispatch, State } from '../../redux/config'
import { AuthState } from '../../redux/slices/auth.slice'
import { BaseProps } from '../../types/BaseProps'
import { UserGroupIcon } from '../icons/hero-icons/UserGroup'

export function DashboardHomePage(props: BaseProps) {
    const userState = useSelector<State, AuthState>((state) => state.auth)
    const dispatch: AppDispatch = useDispatch()

    useEffect(() => {
        dispatch(setOpsNavigationTitle('Home'))
        dispatch(setShowOpsBackButton(false))
        ReactTooltip.rebuild()
    }, [])

    return (
        <div className={'flex flex-col items-center justify-center'}>
            <h1 className={'text-primary text-3xl'}>{`Welcome, ${userState.user?.firstName}`}</h1>
            <div className={'flex flex-col items-center w-full justify-center px-4 md:px-8 mt-4'}>
                <DashboardLargeLink
                    href={'/dashboard/users'}
                    icon={<UserGroupIcon strokeColor={TEXT_COLOR} />}
                    title={'Users'}
                    subtext={'Manage our user base'}
                />
                <DashboardLargeLink
                    href={'/dashboard/watchlist'}
                    icon={<ClockIcon className={'h-6 w-6'} style={{ color: TEXT_COLOR }} />}
                    title={'Watchlist'}
                    subtext={'Agreements that we have yet to match to an incoming transaction'}
                />
                <DashboardLargeLink
                    href={'/dashboard/vendors'}
                    icon={<SwitchHorizontal />}
                    title={'Vendors'}
                    subtext={
                        'Curate our database of vendors that are presented to users when setting up shared expenses'
                    }
                />
                {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && (
                    <DashboardLargeLink
                        href={'/dashboard/dev'}
                        icon={<CodeIcon />}
                        title={'Development Resources'}
                        subtext={'A collection of testing tools for development'}
                    />
                )}
            </div>
        </div>
    )
}
