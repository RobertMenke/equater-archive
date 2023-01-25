import * as React from 'react'

export function SvgShoppingBagObjectColor(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" {...props}>
            <rect width={24} height={24} rx={0} ry={0} />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.8 11.1v-4c0-2.09-1.71-3.8-3.8-3.8S8.2 5 8.2 7.1v4a.998.998 0 01-.6 1.8 1 1 0 01-.6-1.8v-4c0-2.76 2.24-5 5-5s5 2.24 5 5v4a.999.999 0 01-.6 1.8 1 1 0 01-.6-1.8z"
                fill="#D7D0DC"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.8 10.1V8.9H8.2v1.2h7.6zm-8.8 0V8.9H4.1c-.33 0-.6.27-.6.6v9.8c0 1.43 1.17 2.6 2.6 2.6h11.8c1.43 0 2.6-1.17 2.6-2.6V9.5c0-.33-.27-.6-.6-.6H17v1.2h2.3v9.2c0 .77-.63 1.4-1.4 1.4H6.1c-.77 0-1.4-.63-1.4-1.4v-9.2H7z"
                fill="#7a04eb"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.6 11.9a1 1 0 11-2 0 1 1 0 012 0zm8.8 0a1 1 0 11-2 0 1 1 0 012 0z"
                fill="#000"
                fillOpacity={0.3}
            />
        </svg>
    )
}
