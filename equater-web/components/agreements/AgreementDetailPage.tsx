import axios from 'axios'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ReactTooltip from 'react-tooltip'
import { AppDispatch } from '../../redux/config'
import { User } from '../../redux/slices/auth.slice'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { BaseProps } from '../../types/BaseProps'
import { TransactionStory, UserAgreementStory } from '../../types/shared-expense'
import { UserAgreementStoryRow } from '../expense/shared-expense-story-row'
import { LoadingSection, Section } from '../layout/section'
import { TransactionRow } from '../transactions/TransactionStoryRow'
import { VendorRow } from '../transactions/vendor-row'
import { UserRow } from '../users/user-row'

interface Props extends BaseProps {
    user: User
}

export function AgreementDetailPage(props: Props) {
    const { id } = useParams()
    const dispatch: AppDispatch = useDispatch()
    const [story, setStory] = useState<UserAgreementStory | null>(null)
    const [payee, setPayee] = useState<User | null>(null)
    const [transactions, setTransactions] = useState<TransactionStory[]>([])
    const vendor = story?.vendor
    const user = story?.initiatingUser

    useEffect(() => {
        dispatch(setOpsNavigationTitle('Loading...'))
        dispatch(setShowOpsBackButton(true))
        ReactTooltip.rebuild()
        fetchAgreement().catch(console.error)
    }, [])

    async function fetchAgreement() {
        try {
            const response = await axios.get<UserAgreementStory>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/agreement/${id}`
            )

            setStory(response.data)
            dispatch(setOpsNavigationTitle(response.data.sharedExpense.expenseNickName))
            fetchUser(response.data.userAgreement.userId).catch(console.error)
        } catch (e) {
            console.error(e)
            toast(`Error fetching agreement details`)
        }
    }

    async function fetchUser(userId: number) {
        try {
            const response = await axios.get<User>(`${process.env.NEXT_PUBLIC_API_HOST}/api/user/${userId}`)

            setPayee(response.data)
            getTransactions(response.data.id).catch(console.error)
        } catch (e) {
            console.error(e)
            toast(`Error fetching payee`)
        }
    }

    async function getTransactions(payeeId: number) {
        try {
            const { data } = await axios.get<TransactionStory[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/user/transactions/${payeeId}`
            )

            const agreementTransactions = data.filter(
                (transactionStory) => transactionStory.sharedExpenseAgreement.id === parseInt(id || '0', 10)
            )
            setTransactions(agreementTransactions)
        } catch (e) {
            console.error(e)
            toast('Failed to fetch user transactions')
        }
    }

    if (!story) {
        return <LoadingSection />
    }

    return (
        <>
            <Section title={'Expense Owner'}>
                <UserRow user={story.initiatingUser} />
            </Section>
            <Section title={'Payee'}>
                {!payee && <LoadingSection />}
                {payee && <UserRow user={payee} />}
            </Section>
            <Section title={'Agreement Type'} subtitle={vendor ? `Shared Bill` : `Recurring Payment`}>
                <UserAgreementStoryRow story={story} />
            </Section>
            {story.vendor && (
                <Section title={'Vendor'}>
                    <VendorRow vendor={story.vendor} />
                </Section>
            )}
            {user && (
                <Section title={'Transactions'}>
                    {transactions.map((transaction) => (
                        <TransactionRow key={transaction.transaction.id} story={transaction} user={user} />
                    ))}
                </Section>
            )}
        </>
    )
}
