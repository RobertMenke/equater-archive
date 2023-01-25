import * as React from 'react'
import { BaseProps } from '../../../types/BaseProps'
import { DatabaseAdd } from '../../icons/shape-so/database-add'
import { Button, ButtonRole } from '../input/button'
import { Transition } from '../utils/transition'

interface Props extends BaseProps {
    visible: boolean
    setIsVisible: (isVisible: boolean) => void
    isLoading: boolean
    title: string
    description: string
    confirmationText: string
    onCancel: () => void
    onConfirm: () => void | Promise<void>
    alertType: AlertType
}

export enum AlertType {
    INFO,
    WARNING,
    DANGER,
    CREATE
}

export function Alert(props: Props) {
    function getButtonColor() {
        switch (props.alertType) {
            case AlertType.INFO:
                return 'app-accent'
            case AlertType.WARNING:
                return 'orange-600'
            case AlertType.DANGER:
                return 'red-600'
            case AlertType.CREATE:
                return 'app-accent'
        }
    }

    function getButtonActiveColor() {
        switch (props.alertType) {
            case AlertType.INFO:
                return 'app-accent-dark'
            case AlertType.WARNING:
                return 'orange-700'
            case AlertType.DANGER:
                return 'red-700'
            case AlertType.CREATE:
                return 'app-accent-dark'
        }
    }

    function getButtonHoverColor() {
        switch (props.alertType) {
            case AlertType.INFO:
                return 'app-accent-light'
            case AlertType.WARNING:
                return 'orange-500'
            case AlertType.DANGER:
                return 'red-500'
            case AlertType.CREATE:
                return 'app-accent-light'
        }
    }

    function getIconColor() {
        switch (props.alertType) {
            case AlertType.INFO:
                return 'app-accent'
            case AlertType.WARNING:
                return 'orange-600'
            case AlertType.DANGER:
                return 'red-600'
            case AlertType.CREATE:
                return 'green-600'
        }
    }

    function getIconBackgroundColor() {
        switch (props.alertType) {
            case AlertType.INFO:
                return 'app-accent-100'
            case AlertType.WARNING:
                return 'orange-100'
            case AlertType.DANGER:
                return 'red-100'
            case AlertType.CREATE:
                return 'green-100'
        }
    }

    function getIcon() {
        switch (props.alertType) {
            case AlertType.INFO:
            case AlertType.WARNING:
            case AlertType.DANGER:
                return <CautionIcon />
            case AlertType.CREATE:
                // green-700
                return <DatabaseAdd strokeColor={'#047857'} />
        }
    }

    function CautionIcon() {
        return (
            <svg className={`h-6 w-6 text-${getIconColor()}`} stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
        )
    }

    return (
        <div
            className={`fixed bottom-0 inset-x-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-20`}
            style={{ ...(!props.visible && { display: 'none' }) }}
        >
            <Transition
                show={props.visible}
                enter={`ease-out duration-300`}
                enterFrom={'opacity-0'}
                enterTo={`opacity-100`}
                leave={`ease-in duration-200`}
                leaveFrom={`opacity-100`}
                leaveTo={`opacity-0`}
            >
                <div className="fixed inset-0 transition-opacity" onClick={() => props.setIsVisible(false)}>
                    <div className="absolute inset-0 bg-gray-900 opacity-75" />
                </div>
            </Transition>

            <Transition
                show={props.visible}
                enter={`ease-out duration-300`}
                enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
                enterTo={`opacity-100 translate-y-0 sm:scale-100`}
                leave={`ease-in duration-200`}
                leaveFrom={`opacity-100 translate-y-0 sm:scale-100`}
                leaveTo={`opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95`}
            >
                <div className="theme-dark bg-app-secondary rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:p-6">
                    <div className="sm:flex sm:items-start">
                        <div
                            className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-${getIconBackgroundColor()} sm:mx-0 sm:h-10 sm:w-10`}
                        >
                            {getIcon()}
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-bold text-primary">{props.title}</h3>
                            <div className="mt-2">
                                <p className="text-sm leading-5 text-secondary max-w-lg">{props.description}</p>
                            </div>
                        </div>
                    </div>
                    {props.children}
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                            onClick={props.onConfirm}
                            text={props.confirmationText}
                            isLoading={props.isLoading}
                            role={ButtonRole.PRIMARY}
                            className={'mx-4'}
                        />
                        <Button
                            onClick={props.onCancel}
                            text={'Cancel'}
                            isLoading={false}
                            role={ButtonRole.SECONDARY}
                        />
                    </div>
                </div>
            </Transition>
        </div>
    )
}
