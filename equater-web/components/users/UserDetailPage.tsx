import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ReactTooltip from 'react-tooltip'
import { AppDispatch } from '../../redux/config'
import { User } from '../../redux/slices/auth.slice'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { fetchUser } from '../../redux/slices/simulate-transaction.slice'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { UserAccountsSection } from './UserAccountsSection'
import { UserAgreementsSection } from './UserAgreementsSection'
import { UserDetailSection } from './UserDetailSection'
import { UserTransactionsSection } from './UserTransactionsSection'

export function UserDetailPage() {
    const dispatch: AppDispatch = useDispatch()
    const { id } = useParams()
    const userId = parseInt(id || '0', 10)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        getUser().catch(console.error)
        dispatch(setOpsNavigationTitle('Loading...'))
        dispatch(setShowOpsBackButton(true))
        ReactTooltip.rebuild()
    }, [])

    async function getUser() {
        try {
            const user = await fetchUser(userId)
            setUser(user)
            dispatch(setOpsNavigationTitle(`${user.firstName} ${user.lastName}`))
        } catch (e) {
            toast(`Failed to fetch user. Reload the page to try again.`)
        }
    }

    if (!user) {
        return (
            <div className={'flex items-center justify-center p-32'}>
                <CircularSpinner />
            </div>
        )
    }

    return (
        <div className={'mx-2 md:mx-8'}>
            <UserDetailSection user={user} />
            <UserAccountsSection user={user} />
            <UserAgreementsSection user={user} />
            <UserTransactionsSection user={user} />
        </div>
    )
}
