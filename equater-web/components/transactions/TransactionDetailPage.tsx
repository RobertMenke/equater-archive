import Dinero from 'dinero.js'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { AppDispatch } from '../../redux/config'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { fetchAgreement, fetchTransactionStory } from '../../services/requests'
import { TransactionStory, UserAgreementStory } from '../../types/shared-expense'
import { formatDateVerbose } from '../../utils/date.utils'
import { UserAgreementStoryRow } from '../expense/shared-expense-story-row'
import { LoadingSection, Section } from '../layout/section'
import { UserRow } from '../users/user-row'
import { VendorRow } from './vendor-row'

export function TransactionDetailPage() {
    const { id } = useParams()
    const transactionId = parseInt(id || '0', 10)
    const dispatch: AppDispatch = useDispatch()
    const [story, setStory] = useState<TransactionStory | null>(null)
    const [agreement, setAgreement] = useState<UserAgreementStory | null>(null)

    useEffect(() => {
        fetchTransactionDetail().catch(console.error)
        dispatch(setOpsNavigationTitle('Loading...'))
        dispatch(setShowOpsBackButton(true))
        ReactTooltip.rebuild()
    }, [])

    async function fetchTransactionDetail() {
        const story = await fetchTransactionStory(transactionId)

        if (!story) {
            return
        }

        setStory(story)
        dispatch(setOpsNavigationTitle(`Transaction for ${story.sharedExpense.expenseNickName}`))
        const agreement = await fetchAgreement(story.sharedExpenseAgreement.id)

        if (!agreement) {
            return
        }

        setAgreement(agreement)
    }

    if (!story) {
        return <LoadingSection />
    }

    return (
        <>
            <Section title={'Payer'}>
                <UserRow user={story.payer} />
            </Section>
            <Section title={'Recipient'}>
                <UserRow user={story.recipient} />
            </Section>
            <Section title={'Agreement'}>
                {!agreement && <LoadingSection />}
                {agreement && <UserAgreementStoryRow story={agreement} />}
            </Section>
            {story.vendor && (
                <Section title={'Vendor'}>
                    <VendorRow vendor={story.vendor} />
                </Section>
            )}
            <Section title={'Details'}>
                <TransactionDetailSection story={story} />
            </Section>
        </>
    )
}

interface TransactionDetailProps {
    story: TransactionStory
}

function TransactionDetailSection({ story }: TransactionDetailProps) {
    const dateTimeInitiated = new Date(Date.parse(story.transaction.dateTimeInitiated))
    const dateTimeTransferredToDestination = story.transaction.dateTimeTransferredToDestination
        ? new Date(Date.parse(story.transaction.dateTimeTransferredToDestination))
        : null
    const amount = Dinero({ amount: story.transaction.totalTransactionAmount, currency: 'USD' })

    return (
        <div className="bg-app-secondary overflow-hidden">
            <div className="border-t border-gray-800 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-800">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Amount</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {amount.toFormat('$0,0.00')}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">{`${
                            story.transaction.dateTimeTransferredToDestination ? 'Completed' : 'Pending'
                        }`}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Date Time Initiated</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {formatDateVerbose(dateTimeInitiated)}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Date Time Transferred To Destination</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {dateTimeTransferredToDestination
                                ? formatDateVerbose(dateTimeTransferredToDestination)
                                : 'Transfer Incomplete'}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Number of Times Attempted</dt>
                        <dd className="mt-1 text-sm text-gray-400 sm:mt-0 sm:col-span-2">
                            {story.transaction.numberOfTimesAttempted}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    )
}
