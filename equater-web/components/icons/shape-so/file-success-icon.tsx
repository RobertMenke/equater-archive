import { SVGProps } from 'react'
import * as React from 'react'

export function FileSuccessIcon(props: SVGProps<HTMLOrSVGElement>) {
    return (
        <svg
            width={props.width || 24}
            height={props.height || 24}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                fill="#98EED5"
                d="M20 13C19.17 12.37 18.13 12 17 12C14.24 12 12 14.24 12 17C12 18.13 12.37 19.17 13 20H3C2.45 20 2 19.55 2 19V3C2 2.45 2.45 2 3 2H15.59C15.85 2 16.11 2.11 16.29 2.29L19.71 5.71C19.89 5.89 20 6.15 20 6.41V13Z"
            />
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                d="M12.1 16H6"
            />
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                d="M6 11H16"
            />
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                d="M6 6H11"
            />
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                fill="#98EED5"
                d="M17 22C19.7614 22 22 19.7614 22 17C22 14.2386 19.7614 12 17 12C14.2386 12 12 14.2386 12 17C12 19.7614 14.2386 22 17 22Z"
            />
            <path strokeMiterlimit="10" strokeWidth="1" stroke="#265F58" d="M14.6 16.35L16.4 18.15L19.4 15.15" />
            <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="1"
                stroke="#265F58"
                fill="#98EED5"
                d="M15 2V7H20V6.41C20 6.15 19.89 5.89 19.71 5.71L16.29 2.29C16.11 2.11 15.85 2 15.59 2H15Z"
            />
        </svg>
    )
}
