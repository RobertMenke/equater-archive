import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import * as React from 'react'
import { PlaidTransactionContext } from '../../redux/slices/transaction.slice'
import { formatDateVerbose } from '../../utils/date.utils'
import { TwoColumnGrid } from '../data/TwoColumnGrid'
import Dinero from 'dinero.js'

interface Props {
    context: PlaidTransactionContext
}

export function VendorTransactionDetail({ context }: Props) {
    const amount = Dinero({ amount: context.transaction.amount, precision: 2, currency: 'USD' })

    function getAddress(): string {
        const user = context.user
        if (!user.addressTwo) {
            return `${user.addressOne}, ${user.city}, ${user.state}, ${user.postalCode}`
        }

        return `${user.addressOne}, ${user.addressTwo}, ${user.city}, ${user.state}, ${user.postalCode}`
    }

    return (
        <div className={'my-8'}>
            <div className={'w-8/12 text-xl text-gray-400 p-3'}>
                {formatDateVerbose(new Date(Date.parse(context.transaction.date)))}
            </div>
            <TwoColumnGrid
                className={'px-4 my-2'}
                data={[
                    {
                        key: 'Amount',
                        value: amount.toFormat('$0,0.00')
                    },
                    {
                        key: 'Transaction Name',
                        value: context.transaction.transactionName || 'Unknown'
                    },
                    {
                        key: 'Merchant Name',
                        value: context.transaction.merchantName || 'Unknown'
                    },
                    {
                        key: (
                            <div className={'flex flex-row items-center'}>
                                <a href={`/dashboard/users/${context.user.id}`} target={'_blank'} rel={'noreferrer'}>
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2 cursor:pointer" />
                                </a>
                                <span>User</span>
                            </div>
                        ),
                        value: `${context.user.firstName} ${context.user.lastName}`
                    },
                    {
                        key: 'User Email',
                        value: context.user.email
                    },
                    {
                        key: (
                            <div className={'flex flex-row items-center'}>
                                <a
                                    href={`https://maps.google.com/?q=${getAddress()}`}
                                    target={'_blank'}
                                    rel={'noreferrer'}
                                >
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2 cursor:pointer" />
                                </a>
                                <span>User Address</span>
                            </div>
                        ),
                        value: (
                            <a
                                className="text-blue-500 underline"
                                href={`https://maps.google.com/?q=${getAddress()}`}
                                target={'_blank'}
                                rel={'noreferrer'}
                            >
                                {getAddress()}
                            </a>
                        )
                    },
                    {
                        key: 'Account',
                        value: `${context.account.accountName} with ${context.account.institutionName}`
                    },
                    {
                        key: 'Transaction ID',
                        value: context.transaction.transactionId
                    },
                    {
                        key: 'Pending Transaction ID',
                        value: context.transaction.isPending ? 'N/A' : context.transaction.pendingTransactionId
                    },
                    {
                        key: 'Category Type',
                        value: context.categoryContext.categoryType
                    },
                    {
                        key: 'Category Description',
                        value: context.categoryContext.description
                    }
                ]}
            />
        </div>
    )
}
