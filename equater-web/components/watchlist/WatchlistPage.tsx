import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import ReactTooltip from 'react-tooltip'
import { AppDispatch } from '../../redux/config'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { AgreementWatchlist } from '../../types/shared-expense'
import { UserAgreementStoryRow } from '../expense/shared-expense-story-row'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { NotFoundIllustration } from '../illustration/shape-so/NotFoundIllustration'
import { Section } from '../layout/section'

export function WatchlistPage() {
    const dispatch: AppDispatch = useDispatch()
    const [watchlist, setWatchlist] = useState<AgreementWatchlist | null>(null)

    useEffect(() => {
        dispatch(setOpsNavigationTitle('Watchlist'))
        dispatch(setShowOpsBackButton(false))
        ReactTooltip.rebuild()
        fetchWatchlist().catch(console.error)
    }, [])

    async function fetchWatchlist() {
        try {
            const response = await axios.get<AgreementWatchlist>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/ops/agreement-watchlist`
            )

            setWatchlist(response.data)
        } catch (e) {
            console.error(e)
            toast(`Error fetching agreement watchlist`)
        }
    }

    if (!watchlist) {
        return (
            <div className={'flex justify-center items-center md:px-32 md:py-8'}>
                <CircularSpinner />
            </div>
        )
    }

    return (
        <div className={'mx-2 md:mx-4'}>
            <Section title={'New Agreements With New Merchants'}>
                {watchlist.newAgreementsWithNewVendors.length === 0 && (
                    <div className={'flex justify-center items-center md:px-32 md:py-8'}>
                        <NotFoundIllustration />
                    </div>
                )}
                {watchlist.newAgreementsWithNewVendors.map((story) => (
                    <UserAgreementStoryRow key={story.userAgreement.id} story={story} />
                ))}
            </Section>
            <Section title={'New Agreements With Existing Merchants'}>
                {watchlist.newAgreements.length === 0 && (
                    <div className={'flex justify-center items-center py-4 md:px-32 md:py-8'}>
                        <NotFoundIllustration />
                    </div>
                )}
                {watchlist.newAgreements.map((story) => (
                    <UserAgreementStoryRow key={story.userAgreement.id} story={story} />
                ))}
            </Section>
        </div>
    )
}
