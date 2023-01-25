import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { User } from '../../redux/slices/auth.slice'
import { BaseProps } from '../../types/BaseProps'
import { UserAgreementStory } from '../../types/shared-expense'
import { UserAgreementStoryRow } from '../expense/shared-expense-story-row'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { Section } from '../layout/section'

interface Props extends BaseProps {
    user: User
}

export function UserAgreementsSection(props: Props) {
    const [agreements, setAgreements] = useState<UserAgreementStory[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        getAgreements().then((agreement) => {
            setAgreements(agreement)
            setIsLoading(false)
        })
    }, [])

    async function getAgreements(): Promise<UserAgreementStory[]> {
        try {
            const { data } = await axios.get<UserAgreementStory[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/user/agreements/${props.user.id}`
            )

            return data
        } catch (e) {
            console.error(e)
            toast('Failed to fetch user agreements')
            return []
        }
    }

    return (
        <Section title={'Agreements'}>
            {isLoading && (
                <div className={'flex items-center justify-center p-16'}>
                    <CircularSpinner />
                </div>
            )}

            {!isLoading &&
                agreements.map((agreement) => (
                    <UserAgreementStoryRow story={agreement} key={agreement.userAgreement.id} />
                ))}
        </Section>
    )
}
