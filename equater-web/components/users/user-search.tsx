import { useState } from 'react'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { AppColor } from '../../constants/colors'
import { AppDispatch } from '../../redux/config'
import { User } from '../../redux/slices/auth.slice'
import { SearchInput } from '../search/search-input'
import { searchUsers } from '../../redux/slices/simulate-transaction.slice'

interface Props {
    background?: AppColor
    showFilters?: boolean
    autoFocus: boolean
    setUserList: (users: User[]) => void | Promise<void>
    shouldShowNoResults: (flag: boolean) => void | Promise<void>
    isLoading: boolean
    setIsLoading: (isLoading: boolean) => void | Promise<void>
}

export function UserSearch(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const [searchValue, setSearchValue] = useState('')

    return (
        <div className={'flex flex-col mt-2 mb-2 pt-4 pb-4'}>
            <SearchInput
                autoFocus={props.autoFocus}
                background={props.background}
                searchValue={searchValue}
                isLoading={props.isLoading}
                setSearchValue={(value) => {
                    setSearchValue(value)
                }}
                placeholderText={'Search users by name or email'}
                onSearchInput={(value, cancelToken) => {
                    props.shouldShowNoResults(false)

                    if (value.trim().length === 0) {
                        props.setUserList([])
                        props.setIsLoading(false)
                        return
                    }

                    props.setIsLoading(true)
                    dispatch(
                        searchUsers(value, cancelToken.token, (userList) => {
                            props.setIsLoading(false)
                            props.setUserList(userList)
                            props.shouldShowNoResults(userList.length === 0)
                        })
                    )
                }}
            />
        </div>
    )
}
