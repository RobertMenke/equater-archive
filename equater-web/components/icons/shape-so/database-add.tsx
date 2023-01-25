import * as React from 'react'

interface DatabaseAddProps {
    strokeColor: string
}

export function DatabaseAdd(props: DatabaseAddProps) {
    return (
        <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    d="M2 9C2 10.66 6.48 12 12 12C17.52 12 22 10.66 22 9V4.5C22 5.88 17.52 7 12 7C6.48 7 2 5.88 2 4.5V9Z"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    d="M12 7C17.5228 7 22 5.88071 22 4.5C22 3.11929 17.5228 2 12 2C6.47715 2 2 3.11929 2 4.5C2 5.88071 6.47715 7 12 7Z"
                />
                <path
                    fill="none"
                    d="M22 17V14V9C22 10.66 17.52 12 12 12C6.48 12 2 10.66 2 9V14C2 15.66 6.48 17 12 17C12 14.24 14.24 12 17 12C19.76 12 22 14.24 22 17C22 14.24 19.76 12 17 12C14.24 12 12 14.24 12 17"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M22 17V14V9C22 10.66 17.52 12 12 12C6.48 12 2 10.66 2 9V14C2 15.66 6.48 17 12 17C12 14.24 14.24 12 17 12C19.76 12 22 14.24 22 17ZM22 17C22 14.24 19.76 12 17 12C14.24 12 12 14.24 12 17"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    d="M15.57 21.79C15.57 21.79 15.56 21.79 15.55 21.79C13.5 21.17 12 19.26 12 17C6.48 17 2 15.66 2 14V19C2 20.66 6.48 22 12 22C13.26 22 14.44 21.93 15.55 21.79C15.56 21.79 15.57 21.79 15.57 21.79Z"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    d="M17 22C19.7614 22 22 19.7614 22 17C22 14.2386 19.7614 12 17 12C14.2386 12 12 14.2386 12 17C12 19.7614 14.2386 22 17 22Z"
                />
                <path
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M17 14V20"
                />
                <path
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M20 17H14"
                />
            </svg>
        </>
    )
}
