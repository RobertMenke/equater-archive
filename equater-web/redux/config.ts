import { createWrapper } from 'next-redux-wrapper'
import { AuthState } from './slices/auth.slice'
import { OpsNavigationState } from './slices/ops-navigation.slice'
import { SimulateTransactionState } from './slices/simulate-transaction.slice'
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './slices'
import { TooltipState } from './slices/tooltip.slice'
import { TransactionState } from './slices/transaction.slice'

export interface State {
    auth: AuthState
    transaction: TransactionState
    simulateTransaction: SimulateTransactionState
    opsNavigationState: OpsNavigationState
    tooltipState: TooltipState
}

export const store = configureStore({
    reducer: rootReducer
})

// @ts-ignore
if (process.env.NODE_ENV === 'development' && module.hot) {
    // @ts-ignore
    module.hot.accept('./slices', () => {
        const newRootReducer = require('./slices').default
        store.replaceReducer(newRootReducer)
    })
}

export const wrapper = createWrapper(() => store, {
    debug: false //process.env.NODE_ENV === 'development'
})

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
