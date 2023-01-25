import * as React from 'react'

export function SvgCardObjectColor(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14 14.5a1.5 1.5 0 011.5-1.5h2a1.5 1.5 0 010 3h-2a1.5 1.5 0 01-1.5-1.5zm-9 1.1a.6.6 0 01.6-.6h5.8a.6.6 0 110 1.2H5.6a.6.6 0 01-.6-.6zm.6-2.6a.6.6 0 100 1.2h2.8a.6.6 0 100-1.2H5.6z"
                fill="#D7D0DC"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm1.2 4v5.8a1 1 0 001 1h15.6a1 1 0 001-1V11H3.2zm17.6-3H3.2v-.8a1 1 0 011-1h15.6a1 1 0 011 1V8z"
                fill="#7a04eb"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.6 13a.6.6 0 100 1.2h2.8a.6.6 0 100-1.2H5.6zm0 2a.6.6 0 100 1.2h5.8a.6.6 0 100-1.2H5.6z"
                fill="#000"
                fillOpacity={0.3}
            />
        </svg>
    )
}
