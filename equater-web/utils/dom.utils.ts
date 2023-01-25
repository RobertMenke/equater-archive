import * as React from 'react'

export function scrollReachedBottom(e: React.UIEvent<HTMLElement, UIEvent>) {
    return e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight
}

export function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ')
}
