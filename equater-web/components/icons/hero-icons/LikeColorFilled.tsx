import * as React from 'react'

export function SvgLikeColorFilled(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width={36} height={36} {...props}>
            <g fill="none" fillRule="evenodd">
                <path d="M0 0h36v36H0z" />
                <path
                    d="M19.252 3A2.752 2.752 0 0016.5 5.752a13.76 13.76 0 01-1.453 6.153l-1.36 2.72L9.75 18v10.5L15 33h11.89a4.5 4.5 0 004.447-3.816l1.615-10.5a4.5 4.5 0 00-4.447-5.184h-6.38l.677-2.709a15 15 0 00.448-3.638V6a3 3 0 00-3-3h-.998z"
                    fill="#D7D0DC"
                />
                <path
                    d="M3 13.5A1.5 1.5 0 014.5 12h5.25a1.5 1.5 0 011.5 1.5v18a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 31.5v-18z"
                    fill="#7A04EB"
                />
                <path
                    d="M3 13.5A1.5 1.5 0 014.5 12h5.25a1.5 1.5 0 011.5 1.5v18a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 31.5v-18z"
                    fillOpacity={0.01}
                    fill="#FFF"
                />
            </g>
        </svg>
    )
}
