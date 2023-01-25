import * as React from 'react'

interface Props {
    radius: number
    fill: string
}

export function SvgCircleTextPrimary(props: Props) {
    return (
        <svg
            width={props.radius * 2}
            height={props.radius * 2}
            viewBox={`0 0 ${props.radius * 2} ${props.radius * 2}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx={props.radius} cy={props.radius} r={props.radius} fill={props.fill} />
        </svg>
    )
}
