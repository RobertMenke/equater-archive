import { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export interface BaseProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode
    style?: CSSProperties
    className?: string
}
