import { Link } from 'react-router-dom'
import * as React from 'react'
import { AppColor } from '../../constants/colors'
import { User } from '../../redux/slices/auth.slice'
import { ArrowRightBold } from '../icons/shape-so/arrow-right-bold'
import { UserAvatar } from './user-avatar'

interface Props {
    user: User
    onRowClicked?: (user: User) => void
    backgroundClassName?: string
}

export function UserRow(props: Props) {
    return (
        <Link
            to={`/dashboard/users/${props.user.id}`}
            key={props.user.id}
            onClick={(e) => {
                if (props.onRowClicked) {
                    e.preventDefault()
                    e.stopPropagation()
                    props.onRowClicked(props.user)
                }
            }}
        >
            <div
                className={`theme-dark ${
                    props.backgroundClassName ? props.backgroundClassName : 'bg-app-primary'
                } hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
            >
                <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                    <div className={`flex flex-col relative items-center justify-center`}>
                        <UserAvatar user={props.user} background={AppColor.SECONDARY} />
                    </div>

                    <div className={`flex flex-col items-start p-4`}>
                        <span
                            className={`text-gray-400 font-bold text-md`}
                        >{`${props.user.firstName} ${props.user.lastName}`}</span>
                        <span className={`text-gray-500 font-thin text-sm`}>{`${props.user.email}`}</span>
                    </div>
                </div>
                <div className={`mr-4`}>
                    <ArrowRightBold color={`#cbd5e0`} className={`h-24`} />
                </div>
            </div>
        </Link>
    )
}
