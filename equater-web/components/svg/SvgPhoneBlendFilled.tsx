import * as React from 'react'

export function SvgPhoneBlendFilled(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7 4a1 1 0 011-1h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4z"
                fill="#D7D0DC"
            />
            <path fillRule="evenodd" clipRule="evenodd" d="M7 2.6h10v14H7v-14z" fill="#487EB0" fillOpacity={0.5} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 2a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H8zm7.6 14h1.2V4.2a1 1 0 00-1-1H8.2a1 1 0 00-1 1V16h6.2a.6.6 0 110 1.2H7.2v2.6a1 1 0 001 1h7.6a1 1 0 001-1v-2.6h-1.2a.6.6 0 110-1.2zM10 4.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zM13 19a1 1 0 11-2 0 1 1 0 012 0z"
                fill="#7a04eb"
            />
        </svg>
    )
}
