import React, { SVGProps } from 'react'

export function CheckMarkFilledIcon(props: SVGProps<HTMLOrSVGElement>) {
    return (
        <>
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
                    stroke="#221b38"
                    fill="#C4B6FF"
                    d="M19 22H5C3.34 22 2 20.66 2 19V5C2 3.34 3.34 2 5 2H19C20.66 2 22 3.34 22 5V19C22 20.66 20.66 22 19 22Z"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke="#221b38"
                    d="M7 12L10.5 15.5L17 8.5"
                />
            </svg>
        </>
    )
}
