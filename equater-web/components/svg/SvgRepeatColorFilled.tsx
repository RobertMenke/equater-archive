import * as React from 'react'

export function SvgRepeatColorFilled(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.29 15.71c.2.19.45.29.71.29.26 0 .51-.1.71-.3a.996.996 0 000-1.41l-3-3a.996.996 0 00-1.457.047L1.3 14.29a.996.996 0 101.41 1.41L4 14.41V17c0 1.65 1.35 3 3 3h10c1.65 0 3-1.35 3-3v-1c0-.55-.45-1-1-1s-1 .45-1 1v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.585l1.29 1.295z"
                fill="#D7D0DC"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M19.473 12.88A.986.986 0 0119 13c-.26 0-.51-.1-.71-.29l-3-3A.996.996 0 1116.7 8.3L18 9.594V7c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v1c0 .55-.45 1-1 1s-1-.45-1-1V7c0-1.65 1.35-3 3-3h10c1.65 0 3 1.35 3 3v2.59l1.29-1.29a.996.996 0 111.41 1.41l-2.954 2.954a1.01 1.01 0 01-.273.216z"
                fill="#7a04eb"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.29 12.71c.2.19.45.29.71.29.26 0 .51-.1.7-.29l3-3a.996.996 0 10-1.41-1.41L19 10.59 16.7 8.3a.996.996 0 10-1.41 1.41l3 3zm-11 3c.2.19.45.29.71.29.26 0 .51-.1.71-.3a.996.996 0 000-1.41l-3-3a.996.996 0 00-1.41 0l-3 3a.996.996 0 101.41 1.41L5 13.41l2.29 2.3z"
                fill="#000"
                fillOpacity={0.2}
            />
        </svg>
    )
}
