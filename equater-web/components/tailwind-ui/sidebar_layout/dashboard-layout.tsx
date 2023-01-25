import { useEffect, useState } from 'react'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../../redux/config'
import { setScrollIsAtBottom } from '../../../redux/slices/ops-navigation.slice'
import { BaseProps } from '../../../types/BaseProps'
import { scrollReachedBottom } from '../../../utils/dom.utils'
import { DashboardHeader } from './dashboard-header'
import { DashboardMenu } from './dashboard-menu'
import { DashboardMenuMobile } from './dashboard-menu-mobile'

interface Props extends BaseProps {
    title: string
    showBackButton: boolean
}

export function DashboardLayout(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const [state, setState] = useState({
        sidebarOpen: false
    })

    function setSidebarIsOpen(isOpen: boolean) {
        setState({
            ...state,
            sidebarOpen: isOpen
        })
    }

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key.toLowerCase() === 'escape') {
                setSidebarIsOpen(false)
            }
        }

        document.addEventListener('keypress', handleEscape)

        return () => {
            document.removeEventListener('keypress', handleEscape)
        }
    }, [])

    return (
        <div className="h-screen flex overflow-hidden bg-gray-100 theme-dark">
            {/* There's a chrome SVG bug that prevents rendering of the logo when there's another version of the logo in a hidden div. Very strange.*/}
            <DashboardMenuMobile sidebarOpen={state.sidebarOpen} setSidebarIsOpen={setSidebarIsOpen} />
            <DashboardMenu setSidebarIsOpen={setSidebarIsOpen} />
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <DashboardHeader
                    showBackButton={props.showBackButton}
                    title={props.title}
                    sidebarOpen={state.sidebarOpen}
                    setSidebarOpen={setSidebarIsOpen}
                />
                <main
                    className="flex-1 relative z-0 overflow-y-auto py-6 focus:outline-none theme-dark bg-app-primary"
                    tabIndex={0}
                    onScroll={(e) => {
                        dispatch(setScrollIsAtBottom(scrollReachedBottom(e)))
                    }}
                >
                    {props.children}
                </main>
            </div>
        </div>
    )
}
