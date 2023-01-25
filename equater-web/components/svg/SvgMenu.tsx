import * as React from 'react'

export function SvgMenu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 7a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H4.75A.75.75 0 014 7zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H4.75A.75.75 0 014 12zm.75 4.25a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H4.75z"
                fill="#D7D0DC"
            />
        </svg>
    )
}
