import * as React from 'react'
import { CSSTransition } from 'react-transition-group'
import { BaseProps } from '../../../types/BaseProps'

interface Props extends BaseProps {
    show: boolean
    enter: string
    enterFrom: string
    enterTo: string
    leave: string
    leaveFrom: string
    leaveTo: string
}

export function Transition({ show, enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, children }: Props) {
    const enterClasses = enter.split(' ')
    const enterFromClasses = enterFrom.split(' ')
    const enterToClasses = enterTo.split(' ')
    const leaveClasses = leave.split(' ')
    const leaveFromClasses = leaveFrom.split(' ')
    const leaveToClasses = leaveTo.split(' ')

    return (
        <CSSTransition
            unmountOnExit
            in={show}
            addEndListener={(node, done) => {
                node.addEventListener('transitionend', done, false)
            }}
            onEnter={(node: HTMLElement) => {
                node.classList.add(...enterClasses, ...enterFromClasses)
            }}
            onEntering={(node: HTMLElement) => {
                node.classList.remove(...enterFromClasses)
                node.classList.add(...enterToClasses)
            }}
            onEntered={(node: HTMLElement) => {
                node.classList.remove(...enterToClasses, ...enterClasses)
            }}
            onExit={(node) => {
                node.classList.add(...leaveClasses, ...leaveFromClasses)
            }}
            onExiting={(node) => {
                node.classList.remove(...leaveFromClasses)
                node.classList.add(...leaveToClasses)
            }}
            onExited={(node) => {
                node.classList.remove(...leaveToClasses, ...leaveClasses)
            }}
        >
            {children}
        </CSSTransition>
    )
}
