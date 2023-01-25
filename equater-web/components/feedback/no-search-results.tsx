import * as React from 'react'
import { SearchIllustration } from '../illustration/shape-so/search-illustration'

interface Props {
    message: string
}

export function NoSearchResults(props: Props) {
    return (
        <div className={'flex flex-col justify-center align-items-center p-8 text-center'}>
            <span className={'text-gray-500 text-xl'}>{props.message}</span>
            <SearchIllustration className={'max-w-3xl m-auto'} />
        </div>
    )
}
