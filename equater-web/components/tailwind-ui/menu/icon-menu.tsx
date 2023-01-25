import { Transition } from '@headlessui/react'
import { CSSProperties } from 'react'
import * as React from 'react'
import OutsideClickHandler from 'react-outside-click-handler'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    isRightAligned: boolean
    buttonClassName?: string
    menuStyle?: CSSProperties
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void | Promise<void>
}

export function IconMenu(props: Props) {
    return (
        <OutsideClickHandler onOutsideClick={() => props.setIsOpen(false)}>
            <div className="relative inline-block text-left">
                <div>
                    <button
                        className={`flex items-center text-gray-300 hover:text-gray-600 focus:outline-none focus:text-gray-600 cursor:pointer ${
                            props.buttonClassName && props.buttonClassName
                        }`}
                        aria-label="Options"
                        id="options-menu"
                        aria-haspopup="true"
                        aria-expanded="true"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            props.setIsOpen(!props.isOpen)
                        }}
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                </div>
                <Transition
                    show={props.isOpen}
                    enter="transition ease-out duration-100 z-10"
                    enterFrom="transform opacity-0 scale-95 z-10"
                    enterTo="transform opacity-100 scale-100 z-10"
                    leave="transition ease-in duration-75 z-10"
                    leaveFrom="transform opacity-100 scale-100 z-10"
                    leaveTo="transform opacity-0 scale-95 z-10"
                    className={'relative z-20'}
                >
                    <div
                        className={`${
                            props.isRightAligned ? 'right-0' : 'left-0'
                        } origin-top-right absolute mt-2 w-56 rounded-md shadow-lg z-10`}
                        style={props.menuStyle}
                    >
                        <div className="rounded-md bg-app-secondary border-1 border-app-primary text-primary shadow-xs">
                            <div
                                className="py-1"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="options-menu"
                            >
                                {props.children}
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </OutsideClickHandler>
    )
}
