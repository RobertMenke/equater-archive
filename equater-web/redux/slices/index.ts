import { combineReducers } from 'redux'
import auth from './auth.slice'
import transaction from './transaction.slice'
import simulateTransaction from './simulate-transaction.slice'
import opsNavigationState from './ops-navigation.slice'
import { tooltipReducer } from './tooltip.slice'

export default combineReducers({
    auth,
    transaction,
    simulateTransaction,
    opsNavigationState,
    tooltipState: tooltipReducer
})
