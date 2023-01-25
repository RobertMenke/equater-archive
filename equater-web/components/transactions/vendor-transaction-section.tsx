import { useEffect, useState } from 'react'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../../redux/config'
import { fetchTransactions, PlaidTransactionContext } from '../../redux/slices/transaction.slice'
import { Section } from '../layout/section'
import { VendorTransactionDetail } from './vendor-transaction-detail'

export function VendorTransactionSection() {
    const [transactions, setTransactions] = useState<PlaidTransactionContext[]>([])
    const { selectedVendor } = useSelector((state: State) => state.transaction)

    useEffect(() => {
        if (selectedVendor) {
            fetchTransactions(selectedVendor).then((plaidTransactions) => {
                setTransactions(plaidTransactions)
            })
        }
    }, [selectedVendor])

    return (
        <Section title={'Transactions'}>
            {transactions.map((context) => (
                <VendorTransactionDetail context={context} key={context.transaction.id} />
            ))}
        </Section>
    )
}
