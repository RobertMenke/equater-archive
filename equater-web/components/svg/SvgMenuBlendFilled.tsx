import * as React from 'react'

export function SvgMenuBlendFilled(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 4.5h14v3H5v-3zm0 6h14v3H5v-3zm14 6H5v3h14v-3z"
                fill="#D7D0DC"
            />
            <path fillRule="evenodd" clipRule="evenodd" d="M5 10.5h14v3H5v-3z" fill="#F39C1" fillOpacity={0.3} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 5a1 1 0 011-1h9.4a.6.6 0 110 1.199H14V5.2H5.7a.5.5 0 00-.5.5v.6a.5.5 0 00.5.5h12.6a.5.5 0 00.5-.5v-.6a.5.5 0 00-.5-.5h-.8v-.001h-.4A.6.6 0 1117.1 4H19a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm1 5a1 1 0 00-1 1v2a1 1 0 001 1h8.9a.6.6 0 100-1.2H5.7a.5.5 0 01-.5-.5v-.6a.5.5 0 01.5-.5H7v-.001h.4A.6.6 0 007.4 10H5zm5.5 1.2h7.8a.5.5 0 01.5.5v.6a.5.5 0 01-.5.5H16.6a.6.6 0 100 1.2H19a1 1 0 001-1v-2a1 1 0 00-1-1h-8.9a.6.6 0 100 1.199h.4v.001zM4 19a1 1 0 001 1h2.4a.6.6 0 000-1.199H7V18.8H5.7a.5.5 0 01-.5-.5v-.6a.5.5 0 01.5-.5h12.6a.5.5 0 01.5.5v.6a.5.5 0 01-.5.5H17v.001h-.4a.6.6 0 100 1.199H19a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2zm10-.2h-3.5v.001h-.4a.6.6 0 100 1.199h4.3a.6.6 0 100-1.199H14V18.8z"
                fill="#D7D0DC"
            />
        </svg>
    )
}
