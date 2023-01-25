import React from 'react'

interface IconProps {
    strokeColor: string
}

export function CameraIcon(props: IconProps) {
    return (
        <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M5 5L5 7"
                />
                <path
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    d="M22 18C22 19.1046 21.1046 20 20 20L4 20C2.89543 20 2 19.1046 2 18L2 9C2 7.89543 2.89543 7 4 7L6.17158 7C6.70201 7 7.21072 6.78929 7.58579 6.41421L9.41422 4.58579C9.78929 4.21071 10.298 4 10.8284 4L13.1716 4C13.702 4 14.2107 4.21071 14.5858 4.58579L16.4142 6.41421C16.7893 6.78929 17.298 7 17.8284 7H20C21.1046 7 22 7.89543 22 9V18Z"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M8 13H2"
                />
                <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    d="M22 13H16"
                />
                <circle
                    strokeLinecap="round"
                    strokeWidth="1"
                    stroke={props.strokeColor}
                    fill="none"
                    r="4"
                    cy="13"
                    cx="12"
                />
            </svg>
        </>
    )
}
