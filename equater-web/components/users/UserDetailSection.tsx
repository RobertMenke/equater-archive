import * as React from 'react'
import { AppColor } from '../../constants/colors'
import { User } from '../../redux/slices/auth.slice'
import { BaseProps } from '../../types/BaseProps'
import { Section } from '../layout/section'
import { UserAvatar } from './user-avatar'

interface Props extends BaseProps {
    user: User
}

export function UserDetailSection(props: Props) {
    return (
        <Section
            title={`${props.user.firstName}'s Details`}
            rightAlignedAction={<UserAvatar user={props.user} background={AppColor.PRIMARY} />}
        >
            <UserDetail user={props.user} />
        </Section>
    )
}

function UserDetail(props: Props) {
    return (
        <div className="bg-app-secondary overflow-hidden">
            <div className="border-t border-gray-800 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-800">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Full name</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">{`${props.user.firstName} ${props.user.lastName}`}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Email address</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">{props.user.email}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            <span>{props.user.addressOne},</span>
                            {props.user.addressTwo && <span>&nbsp;{props.user.addressTwo},</span>}
                            <span>&nbsp;{`${props.user.city}, ${props.user.state}, ${props.user.postalCode}`}</span>
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Verified Dwolla Customer</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {props.user.canReceiveFunds ? 'yes' : 'no'}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Email is confirmed</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {props.user.emailIsConfirmed ? 'yes' : 'no'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    )
}

interface BinaryStatusProps {
    assertion: boolean
}
