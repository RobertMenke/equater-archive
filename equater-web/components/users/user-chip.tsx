import * as React from 'react'
import { AppColor } from '../../constants/colors'
import { User } from '../../redux/slices/auth.slice'
import { UserAvatar } from './user-avatar'

interface Props {
    user: User
    onClick?: () => void
}

export function UserChip({ user, onClick }: Props) {
    return (
        <div style={{ minWidth: '400px' }}>
            <div
                className={`theme-dark bg-app-primary hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
                onClick={(e) => {
                    if (onClick) {
                        onClick()
                    }
                }}
            >
                <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                    <div className={`flex flex-col relative items-center justify-center`}>
                        <UserAvatar user={user} background={AppColor.SECONDARY} />
                    </div>

                    <div className={`flex flex-col items-start p-4`}>
                        <span
                            className={`text-gray-400 font-bold text-md`}
                        >{`${user.firstName} ${user.lastName}`}</span>
                        <span className={`text-gray-500 font-thin text-sm`}>{`${user.email}`}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
