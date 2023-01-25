import * as React from 'react'
import { UserAccount } from '../../redux/slices/auth.slice'
import { SquareAvatar } from '../images/Avatar'

interface Props {
    account: UserAccount
    onRowClicked?: (account: UserAccount) => void
    backgroundClassName?: string
}

export function UserAccountRow(props: Props) {
    return (
        <div
            className={`theme-dark ${
                props.backgroundClassName ? props.backgroundClassName : 'bg-app-primary'
            } hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
        >
            <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                <div className={`flex flex-col relative items-center justify-center`}>
                    <SquareAvatar url={props.account.institution.logoUrl} />
                </div>

                <div className={`flex flex-col items-start p-4`}>
                    <span className={`text-gray-400 font-bold text-md`}>{props.account.institutionName}</span>
                    <span className={`text-gray-500 font-thin text-sm`}>{props.account.accountName}</span>
                </div>
            </div>
        </div>
    )
}
