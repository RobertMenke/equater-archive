import * as React from 'react'
import { Transition } from 'react-transition-group'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    className: string
    isVisible: boolean
}

export interface Transitions {
    entering: string
    entered: string
    exiting: string
    exited: string
    unmounted: string
}
const transitionStyles: Transitions = {
    entering: 'transition ease-out duration-100',
    entered: 'transform opacity-100 scale-100',
    exiting: 'transition ease-in duration-75',
    exited: 'transform opacity-0 scale-95',
    unmounted: 'transform opacity-0 scale-95'
}

export function Menu(props: Props) {
    return (
        <Transition in={props.isVisible} timeout={100}>
            {(state) => <div className={props.className + ` ${transitionStyles[state]}`}>{props.children}</div>}
        </Transition>
    )
}
