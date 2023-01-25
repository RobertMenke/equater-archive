import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'
import { NavList } from './nav-list'

interface Props extends BaseProps {
    sidebarOpen: boolean
    setSidebarIsOpen: (isOpen: boolean) => void
}

export function DashboardMenuMobile({ setSidebarIsOpen, sidebarOpen }: Props) {
    return (
        <div className="md:hidden">
            <div
                onClick={() => setSidebarIsOpen(false)}
                className={`fixed inset-0 z-30 bg-gray-600 opacity-0 pointer-events-none transition-opacity ease-linear duration-300 ${
                    sidebarOpen ? 'opacity-75 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            />
            <div
                className={`fixed inset-y-0 left-0 flex flex-col z-40 max-w-xs w-full theme-dark bg-app-secondary transform ease-in-out duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="absolute top-0 right-0 -mr-14 p-1">
                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarIsOpen(false)}
                            className="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600"
                        >
                            <svg className="h-6 w-6 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="flex-1 h-0 overflow-y-auto">
                    <nav className="px-2 py-16">
                        <NavList setSidebarIsOpen={setSidebarIsOpen} />
                    </nav>
                </div>
            </div>
        </div>
    )
}
