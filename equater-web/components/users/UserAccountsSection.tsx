import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { User, UserAccount } from '../../redux/slices/auth.slice'
import { BaseProps } from '../../types/BaseProps'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { Section } from '../layout/section'
import { UserAccountRow } from '../user_accounts/UserAccountRow'

interface Props extends BaseProps {
    user: User
}

export function UserAccountsSection(props: Props) {
    const [accounts, setAccounts] = useState<UserAccount[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        getAccounts().then((accounts) => {
            setAccounts(accounts)
            setIsLoading(false)
        })
    }, [])

    async function getAccounts(): Promise<UserAccount[]> {
        try {
            const { data } = await axios.get<UserAccount[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/account/user/${props.user.id}?active=true`
            )

            return data
        } catch (e) {
            console.error(e)
            toast('Failed to fetch user accounts')
            return []
        }
    }

    return (
        <Section title={'Accounts'}>
            {isLoading && (
                <div className={'flex items-center justify-center p-16'}>
                    <CircularSpinner />
                </div>
            )}
            {!isLoading && accounts.map((account) => <UserAccountRow account={account} key={account.id} />)}
        </Section>
    )
}
