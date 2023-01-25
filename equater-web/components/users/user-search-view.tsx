import { useState } from 'react'
import * as React from 'react'
import { User } from '../../redux/slices/auth.slice'
import { NoSearchResults } from '../feedback/no-search-results'
import { UserRow } from './user-row'
import { UserSearch } from './user-search'
import { AppColor } from '../../constants/colors'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    onUserSelected: (user: User) => void | Promise<void>
    background?: AppColor
}

export function UserSearchView(props: Props) {
    const [users, setUsers] = useState<User[]>([])
    const [showNoSearchResults, setShowNoSearchResults] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    function shouldShowNoResults() {
        if (isLoading) {
            return false
        }

        return showNoSearchResults
    }

    return (
        <>
            <UserSearch
                background={props.background ? props.background : AppColor.PRIMARY}
                autoFocus={true}
                setUserList={setUsers}
                shouldShowNoResults={setShowNoSearchResults}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
            />
            {shouldShowNoResults() && <NoSearchResults message={'No Search Results'} />}
            {users.map((user) => (
                <UserRow
                    key={user.id}
                    user={user}
                    onRowClicked={() => {
                        props.onUserSelected(user)
                    }}
                />
            ))}
        </>
    )
}
