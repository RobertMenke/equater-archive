import * as React from 'react'

interface Props {
    className: string
}

export function Logo(props: Props) {
    return <img className={`${props.className}`} src="/static/logo/placeholder.com-logo1-white.png" alt="Workflow" />
}
