import axios from 'axios'
import { toast } from 'react-toastify'
import { TransactionStory, UserAgreementStory } from '../types/shared-expense'

export async function fetchAgreement(id: number): Promise<UserAgreementStory | null> {
    try {
        const response = await axios.get<UserAgreementStory>(
            `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/agreement/${id}`
        )

        return response.data
    } catch (e) {
        console.error(e)
        toast(`Error fetching agreement details`)
        return null
    }
}

export async function fetchTransactionStory(id: number): Promise<TransactionStory | null> {
    try {
        const response = await axios.get<TransactionStory>(
            `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/transaction/${id}`
        )

        return response.data
    } catch (e) {
        console.error(e)
        toast(`Error fetching transaction details`)
        return null
    }
}
