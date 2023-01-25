import Dinero from 'dinero.js'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AppColor } from '../../constants/colors'
import { User } from '../../redux/slices/auth.slice'
import { TransactionStory } from '../../types/shared-expense'
import { ArrowRightBold } from '../icons/shape-so/arrow-right-bold'
import { UserAvatar } from '../users/user-avatar'
import { AgreementAvatar } from './AgreementAvatar'

interface Props {
    story: TransactionStory
    user: User
}

export function TransactionRow({ story, user }: Props) {
    const { transaction, vendor, payer, sharedExpense, sharedExpenseAgreement, recipient } = story
    const amount = Dinero({ amount: transaction.totalTransactionAmount, currency: 'USD' })
    const otherUser = payer.id === user.id ? recipient : payer

    function getText() {
        if (payer.id === user.id) {
            return `Paid to ${recipient.firstName} ${recipient.lastName}`
        }

        return `Paid by ${payer.firstName} ${payer.lastName}`
    }

    return (
        <Link to={`/dashboard/transaction/${transaction.id}`}>
            <div
                className={`theme-dark bg-app-primary hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
                onClick={(e) => {
                    console.log(transaction)
                }}
            >
                <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                    <div className={'h-12 w-12'}>
                        <div
                            className={'absolute transform translate-x-6'}
                            data-tip={vendor ? vendor.friendlyName : 'Recurring Payment'}
                            data-for={'main'}
                        >
                            <AgreementAvatar vendor={vendor} />
                        </div>
                        <div
                            className={'absolute transform -translate-x-2'}
                            data-tip={`${otherUser.firstName} ${otherUser.lastName}`}
                            data-for={'main'}
                        >
                            <UserAvatar user={otherUser} background={AppColor.SECONDARY} />
                        </div>
                    </div>

                    <div className={`flex flex-col items-start p-4 pl-8`}>
                        <span className={`text-gray-500 font-thin text-sm`}>
                            {`${getText()} · ${transaction.dateTimeTransactionScheduled ? 'completed' : 'pending'}`}
                        </span>
                        <span
                            className={`text-gray-400 font-bold text-md ${
                                payer.id === user.id ? 'text-red-400' : 'text-green-400'
                            }`}
                        >
                            {amount.toFormat('$0,0.00')}
                        </span>
                        <span
                            className={`text-gray-500 font-thin text-xs`}
                        >{`${sharedExpense.expenseNickName} · ${transaction.dateTimeInitiated}`}</span>
                    </div>
                </div>
                <div className={`mr-4`}>
                    <ArrowRightBold color={`#cbd5e0`} className={`h-24`} />
                </div>
            </div>
        </Link>
    )
}
