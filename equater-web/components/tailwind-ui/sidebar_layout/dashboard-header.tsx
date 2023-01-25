import Link from 'next/link'
import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useOutsideClickDetection } from '../../../hooks/useOutsideClickDetection'
import { State } from '../../../redux/config'
import { signOut } from '../../../services/auth-service'
import { BaseProps } from '../../../types/BaseProps'
import { ArrowLeft } from '../../icons/hero-icons/arrow-left'
import { Menu } from '../menu/menu'

interface Props extends BaseProps {
    sidebarOpen: boolean
    setSidebarOpen: (isOpen: boolean) => void
    title: string
    showBackButton: boolean
}

export function DashboardHeader(props: Props) {
    const { user } = useSelector((state: State) => state.auth || {})
    const [state, setState] = useState({
        profileMenuOpen: false
    })

    function setProfileMenuIsOpen(isOpen: boolean) {
        setState({
            ...state,
            profileMenuOpen: isOpen
        })
    }

    const navigate = useNavigate()

    const menuRef = useRef(null)
    useOutsideClickDetection(menuRef, () => {
        setProfileMenuIsOpen(false)
    })

    return (
        <div className="theme-dark bg-app-primary relative z-10 flex-shrink-0 flex h-16 border-app-secondary">
            <button
                onClick={() => props.setSidebarOpen(true)}
                className="px-4 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
            >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
            </button>
            <div className="flex-1 px-4 flex justify-between">
                <div className="flex-1 flex">
                    <div className="w-full flex md:ml-0">
                        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                            <div className="absolute inset-y-0 left-0 flex items-center">
                                {props.showBackButton && (
                                    <div
                                        className={'rounded-full hover:bg-app-secondary mr-3 cursor-pointer'}
                                        onClick={() => {
                                            navigate(-1)
                                        }}
                                    >
                                        <ArrowLeft />
                                    </div>
                                )}
                                <h3 className={`text-gray-200`}>{props.title}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ml-4 flex items-center md:ml-6">
                    <div ref={menuRef} className="ml-3 relative">
                        {user && (
                            <div>
                                <button
                                    onClick={() => setProfileMenuIsOpen(!state.profileMenuOpen)}
                                    className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:shadow-outline"
                                >
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={user?.preSignedPhotoDownloadUrl}
                                        alt=""
                                    />
                                </button>
                            </div>
                        )}

                        <Menu
                            className={'origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg'}
                            isVisible={state.profileMenuOpen}
                        >
                            <div className="bg-app-secondary py-1 rounded-md shadow-xs">
                                <Link href={'/sign-in'}>
                                    <a
                                        className="block px-4 py-2 text-sm text-gray-500 transition ease-in-out duration-150"
                                        onClick={() => signOut()}
                                    >
                                        Sign out
                                    </a>
                                </Link>
                            </div>
                        </Menu>
                    </div>
                </div>
            </div>
        </div>
    )
}
