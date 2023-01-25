import axios, { CancelTokenSource } from 'axios'
import * as React from 'react'
import { FocusEventHandler, FormEvent, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { AppColor } from '../../constants/colors'
import { BaseProps } from '../../types/BaseProps'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { SearchBlendFillIcon } from '../icons/shape-so/search-blend-fill-icon'

interface Props extends BaseProps {
    autoFocus: boolean
    background?: AppColor
    isLoading: boolean
    placeholderText: string
    searchValue: string
    setSearchValue: (value: string) => void
    onSearchInput: (value: string, cancelToken: CancelTokenSource) => void | Promise<void>
    onSearchFocused?: FocusEventHandler<HTMLInputElement>
}

export function SearchInput(props: Props) {
    const [debouncedInput] = useDebounce(props.searchValue, 500)
    const backgroundColor = props.background === AppColor.PRIMARY ? 'bg-app-primary' : 'bg-app-secondary'
    const icon = props.isLoading ? (
        <div className={'p-3'}>
            <CircularSpinner />
        </div>
    ) : (
        <div className={'p-3'}>
            <SearchBlendFillIcon />
        </div>
    )

    useEffect(() => {
        const cancelToken = axios.CancelToken.source()
        props.onSearchInput(debouncedInput, cancelToken)

        return () => {
            cancelToken.cancel('Request canceled due to navigation')
        }
    }, [debouncedInput])

    return (
        <div className={`theme-dark ${backgroundColor} flex flex-row justify-start items-center rounded w-full`}>
            {icon}
            <input
                type={'text'}
                className={`theme-dark ${backgroundColor} flex-grow text-gray-500 pt-4 pb-4 pl-2 pr-1 mr-1 font-md placeholder-gray-500 border-transparent`}
                placeholder={props.placeholderText}
                autoFocus={props.autoFocus}
                onFocus={props.onSearchFocused}
                onChange={(event: FormEvent<HTMLInputElement>) => {
                    props.setSearchValue(event.currentTarget.value)
                }}
                value={props.searchValue}
            />
        </div>
    )
}
