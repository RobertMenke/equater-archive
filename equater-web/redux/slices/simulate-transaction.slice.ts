import { AnyAction, createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit'
import axios, { AxiosResponse, CancelToken } from 'axios'
import { Dispatch } from 'react'
import { toast } from 'react-toastify'
import { SharedExpenseStory, TransactionStory } from '../../types/shared-expense'
import { State } from '../config'
import { User, UserAccount } from './auth.slice'

export interface SimulateTransactionState {
    step: SimulateTransactionStep
    sharedExpenseSearchIsLoading: boolean
    selectedUser: User | null
    sharedExpenses: SharedExpenseStory[]
    selectedSharedExpense: SharedExpenseStory | null
    showNoSearchResults: boolean
    simulatedAmount: string
    simulatedSharedExpenseIsLoading: boolean
    error: string | null
}

export enum SimulateTransactionStep {
    SELECT_USER,
    SELECT_TYPE_OF_SIMULATION,
    SELECT_SHARED_EXPENSE,
    ADD_TRANSACTION_DETAIL,
    REVIEW_SHARED_EXPENSE_SIMULATION
}

const initialState: SimulateTransactionState = {
    step: SimulateTransactionStep.SELECT_USER,
    sharedExpenseSearchIsLoading: false,
    selectedUser: null,
    sharedExpenses: [],
    selectedSharedExpense: null,
    showNoSearchResults: false,
    simulatedAmount: '',
    simulatedSharedExpenseIsLoading: false,
    error: null
}

const simulateTransactionSlice = createSlice({
    name: 'simulateTransaction',
    initialState,
    reducers: {
        setTransactionSimulationStep(state, { payload }: PayloadAction<SimulateTransactionStep>) {
            state.step = payload
        },
        setSelectedUser(state, { payload }: PayloadAction<User | null>) {
            state.selectedUser = payload
        },
        setSharedExpenseSearchIsLoading(state, { payload }: PayloadAction<boolean>) {
            state.sharedExpenseSearchIsLoading = payload
        },
        setSharedExpenseStories(state, { payload }: PayloadAction<SharedExpenseStory[]>) {
            state.sharedExpenses = payload
        },
        setSelectedSharedExpense(state, { payload }: PayloadAction<SharedExpenseStory | null>) {
            state.selectedSharedExpense = payload
        },
        setSimulatedAmount(state, { payload }: PayloadAction<string>) {
            state.simulatedAmount = payload
        },
        setSimulatedSharedExpenseIsLoading(state, { payload }: PayloadAction<boolean>) {
            state.simulatedSharedExpenseIsLoading = payload
        },
        setError(state, { payload }: PayloadAction<string | null>) {
            state.error = payload
        }
    }
})

export const {
    setTransactionSimulationStep,
    setSelectedUser,
    setSharedExpenseSearchIsLoading,
    setSharedExpenseStories,
    setSelectedSharedExpense,
    setSimulatedAmount,
    setSimulatedSharedExpenseIsLoading,
    setError
} = simulateTransactionSlice.actions

export default simulateTransactionSlice.reducer

export function fetchUser(userId: number): Promise<User> {
    return axios.get<User>(`${process.env.NEXT_PUBLIC_API_HOST}/api/user/${userId}`).then(({ data }) => data)
}

interface UserSearchFullResponse {
    friends: User[]
    users: User[]
}

export function searchUsers(
    searchTerm: string,
    cancelToken: CancelToken,
    onComplete: (users: User[]) => void | Promise<void>
) {
    return async (dispatch: Dispatch<User[]>, getState: () => State) => {
        try {
            searchTerm = encodeURIComponent(searchTerm)
            const { data } = await axios.get<UserSearchFullResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/user/search?searchTerm=${searchTerm}&includeAuthenticatedUser=true`,
                {
                    cancelToken
                }
            )
            const users = data.friends.concat(data.users)
            // @ts-ignore
            onComplete(users)
        } catch (e) {
            toast('An error occurred loading users')
            // @ts-ignore
            console.error(e.message)
            onComplete([])
        }
    }
}

export function fetchActiveUserAccounts(
    userId: number,
    cancelToken: CancelToken,
    onComplete: (users: UserAccount[]) => void | Promise<void>
) {
    return async (dispatch: Dispatch<User[]>, getState: () => State) => {
        try {
            const { data } = await axios.get<UserAccount[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/account/user/${userId}?active=true`,
                {
                    cancelToken
                }
            )

            onComplete(data)
        } catch (e) {
            // @ts-ignore
            console.error(e.message)
            toast('Failed to fetch user accounts')
            onComplete([])
        }
    }
}

export function fetchSharedExpenses(
    user: User,
    cancelToken: CancelToken
): ThunkAction<void, State, unknown, AnyAction> {
    return async (dispatch: Dispatch<any>, getState: () => State) => {
        try {
            dispatch(setSharedExpenseSearchIsLoading(true))
            const { data } = await axios.get<SharedExpenseStory[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/user/${user.id}`,
                {
                    cancelToken
                }
            )
            dispatch(setSharedExpenseStories(data.filter((expense) => expense.sharedExpense.isActive)))
            dispatch(setSharedExpenseSearchIsLoading(false))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            dispatch(setSharedExpenseSearchIsLoading(false))
        }
    }
}

export interface SimulatedArbitraryTransactionDto {
    amount: number
    transactionName: string
    merchantName: string
    accountId: number
    ppdId: string | null
}

export function simulateArbitraryTransaction(dto: SimulatedArbitraryTransactionDto): Promise<AxiosResponse<void>> {
    return axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/expense/ops/transaction/simulate`, dto)
}

export function simulateTransaction(sharedExpenseId: number, value: number | null) {
    return async (dispatch: Dispatch<any>, getState: () => State) => {
        try {
            dispatch(setSimulatedSharedExpenseIsLoading(true))
            const { status } = await axios.post<TransactionStory>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/expense/ops/${sharedExpenseId}/simulate`,
                {
                    amount: value
                }
            )
            if (status === 201) {
                toast('Successfully simulated transaction')
            } else {
                toast('Failed to simulate transaction')
            }
            dispatch(setSimulatedSharedExpenseIsLoading(false))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            dispatch(setSimulatedSharedExpenseIsLoading(false))
        }
    }
}
