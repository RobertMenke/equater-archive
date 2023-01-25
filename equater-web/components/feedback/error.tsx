import * as React from 'react'

interface Props {
    message: string
}

export function Error(props: Props) {
    return (
        <div className={'flex flex-row justify-center items-center bg-red-500 rounded'}>
            <span className={'p-2 text-red-900'}>{props.message}</span>
        </div>
    )
}
