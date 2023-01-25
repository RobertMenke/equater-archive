import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { User } from '../../redux/slices/auth.slice'
import { Vendor } from '../../redux/slices/transaction.slice'
import { BaseProps } from '../../types/BaseProps'
import { TransactionStory } from '../../types/shared-expense'
import { removeDuplicatesWithSelector } from '../../utils/data.utils'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { Section } from '../layout/section'
import { AgreementAvatar } from '../transactions/AgreementAvatar'
import { TransactionRow } from '../transactions/TransactionStoryRow'

interface Props extends BaseProps {
    user: User
}

interface VendorFilter {
    filterActive: boolean
    vendor: Vendor | null
}

export function UserTransactionsSection(props: Props) {
    const [transactions, setTransactions] = useState<TransactionStory[]>([])
    const [vendors, setVendors] = useState<(Vendor | null)[]>([])
    const [vendorFilter, setVendorFilter] = useState<VendorFilter>({ filterActive: false, vendor: null })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        getTransactions().then((transactions) => {
            setTransactions(transactions)
            setIsLoading(false)
        })
    }, [])

    useEffect(() => {
        const vendors = transactions.map(({ vendor }) => vendor)
        const nonDuplicateVendors = removeDuplicatesWithSelector(vendors, (vendor) => {
            return vendor?.id
        })
        setVendors(nonDuplicateVendors)
    }, [transactions])

    async function getTransactions(): Promise<TransactionStory[]> {
        try {
            const { data } = await axios.get<TransactionStory[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/user/transactions/${props.user.id}`
            )

            return data
        } catch (e) {
            console.error(e)
            toast('Failed to fetch user transactions')
            return []
        }
    }

    function isSelectedVendor(vendor: Vendor | null): boolean {
        return vendorFilter.filterActive && vendorFilter.vendor === vendor
    }

    return (
        <Section title={'Transactions'}>
            {isLoading && (
                <div className={'flex items-center justify-center p-16'}>
                    <CircularSpinner />
                </div>
            )}

            <div className={'flex flex-row items-center justify-start my-4'}>
                {vendors.map((vendor) => (
                    <div
                        key={vendor?.id}
                        className={`mx-2 rounded p-2 ${
                            isSelectedVendor(vendor) ? `border border-gray-400 border-2` : ''
                        }`}
                    >
                        <AgreementAvatar
                            vendor={vendor}
                            onClick={() => {
                                if (isSelectedVendor(vendor)) {
                                    setVendorFilter({ filterActive: false, vendor: null })
                                } else {
                                    setVendorFilter({ filterActive: true, vendor: vendor })
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
            {transactions
                .filter((transaction) =>
                    vendorFilter.filterActive ? transaction.vendor?.id === vendorFilter.vendor?.id : true
                )
                .map((transaction) => (
                    <TransactionRow key={transaction.transaction.id} story={transaction} user={props.user} />
                ))}
        </Section>
    )
}
