import * as React from 'react'

export function SvgArrowDownSign(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={48} height={48} {...props}>
            <g fill="none" fillRule="evenodd">
                <path d="M0 0h48v48H0z" />
                <path
                    d="M23.04 40.725L11.154 28.84c-.24-.24-.36-.54-.36-.84 0-.3.12-.62.36-.84.46-.46 1.22-.46 1.7 0l9.94 9.94V8c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2v29.1l9.96-9.96c.46-.46 1.22-.46 1.7 0s.46 1.22 0 1.7l-12 12a1.167 1.167 0 01-.18.147 1.2 1.2 0 01-1.634-.262z"
                    fill="#D7D0DC"
                />
            </g>
        </svg>
    )
}
