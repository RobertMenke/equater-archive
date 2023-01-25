import * as React from 'react'
import { useDispatch } from 'react-redux'
import { TEXT_COLOR } from '../../../constants/colors'
import { AppDispatch } from '../../../redux/config'
import { setTooltipState, TooltipState } from '../../../redux/slices/tooltip.slice'
import { CircularSpinner } from '../../feedback/CircularSpinner'
import { SvgIconProps } from '../../icons/svg-icon-props'

interface Props {
    onClick: () => void
    text: string
    isLoading: boolean
    role: ButtonRole
    className?: string
    buttonClassName?: string
    style?: React.CSSProperties
    disabled?: boolean
    tooltipText?: string
    tooltipState?: TooltipState
}

export enum ButtonRole {
    PRIMARY,
    SECONDARY
}

// Intentionally keeping the component separated based on role rather than dynamically applying class names so that purgecss doesn't strip css
// in production builds. See https://tailwindcss.com/docs/controlling-file-size/
export function Button(props: Props) {
    if (props.role === ButtonRole.PRIMARY) {
        return (
            <span className={`inline-flex rounded-md shadow-sm ${props.className || ''}`}>
                <button
                    data-for={props.tooltipState ? 'keyboard-shortcut' : 'main'}
                    data-tip={props.tooltipText || ''}
                    type="button"
                    className={`theme-dark flex justify-center items-center text-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-gray-100 bg-app-accent hover:bg-app-accent-light focus:outline-none focus:border-app-accent-dark focus:shadow-outline-indigo active:bg-app-accent-dark transition ease-in-out duration-150 ${
                        props.buttonClassName || ''
                    } ${props.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    onMouseOver={() => {
                        const tooltipState = props.tooltipState

                        if (tooltipState) {
                            // @ts-ignore
                            dispatch(setTooltipState(tooltipState))
                        }
                    }}
                    onClick={props.onClick}
                    style={props.style}
                >
                    {props.isLoading && <CircularSpinner />}
                    {!props.isLoading && props.text}
                </button>
            </span>
        )
    }

    return (
        <span className={`inline-flex rounded-md shadow-sm ${props.className || ''}`}>
            <button
                data-for={props.tooltipState ? 'keyboard-shortcut' : 'main'}
                data-tip={props.tooltipText || ''}
                type="button"
                className={`theme-dark flex justify-center items-center text-center px-4 py-2 border border-app-primary text-sm leading-5 font-medium rounded-md text-primary bg-app-secondary hover:bg-app-secondary-dark focus:outline-none focus:border-blue-300 focus:shadow-outline-indigo active:bg-gray-300 transition ease-in-out duration-150 ${
                    props.buttonClassName || ''
                }`}
                onMouseOver={() => {
                    const tooltipState = props.tooltipState

                    if (tooltipState) {
                        // @ts-ignore
                        dispatch(setTooltipState(tooltipState))
                    }
                }}
                onClick={props.onClick}
                style={props.style}
            >
                {props.isLoading && <CircularSpinner />}
                {!props.isLoading && props.text}
            </button>
        </span>
    )
}

interface IconButtonProps extends Props {
    Icon: React.ElementType<SvgIconProps>
}

export function IconButton(props: IconButtonProps) {
    const dispatch: AppDispatch = useDispatch()
    const extraClasses = props.className || ''
    if (props.role === ButtonRole.PRIMARY) {
        const disabledClasses = props.disabled ? 'cursor-not-allowed opacity-50' : ''

        return (
            <button
                data-for={props.tooltipState ? 'keyboard-shortcut' : 'main'}
                data-tip={props.tooltipText || ''}
                type="button"
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary bg-app-accent hover:bg-app-accent-light focus:outline-none focus:ring-2 focus:border-app-accent-dark active:bg-app-accent-dark transition ease-in-out duration-150 ${
                    props.buttonClassName || ''
                } ${extraClasses} ${disabledClasses}`}
                onMouseOver={() => {
                    const tooltipState = props.tooltipState

                    if (tooltipState) {
                        // @ts-ignore
                        dispatch(setTooltipState(tooltipState))
                    }
                }}
                onClick={props.onClick}
                style={props.style}
            >
                {!props.isLoading && <props.Icon strokeColor={TEXT_COLOR} className={'-ml-1 mr-2 h-5 w-5'} />}
                {props.isLoading && <CircularSpinner />}
                {props.text}
            </button>
        )
    }

    return (
        <span className={`inline-flex rounded-md shadow-sm `}>
            <button
                data-for={props.tooltipState ? 'keyboard-shortcut' : 'main'}
                data-tip={props.tooltipText || ''}
                type="button"
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 bg-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:bg-gray-300 transition ease-in-out duration-150 ${
                    props.buttonClassName || ''
                } ${extraClasses}`}
                onMouseOver={() => {
                    const tooltipState = props.tooltipState

                    if (tooltipState) {
                        // @ts-ignore
                        dispatch(setTooltipState(tooltipState))
                    }
                }}
                onClick={props.onClick}
                style={props.style}
            >
                {!props.isLoading && <props.Icon strokeColor={TEXT_COLOR} className={'-ml-1 mr-2 h-5 w-5'} />}
                {props.isLoading && <CircularSpinner />}
                {props.text}
            </button>
        </span>
    )
}
