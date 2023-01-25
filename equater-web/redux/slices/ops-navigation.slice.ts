import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface OpsNavigationState {
    opsNavigationTitle: string
    showOpsBackButton: boolean
    mainContentScrollIsAtBottom: boolean
    showAddMerchantAlert: boolean
}

const initialState: OpsNavigationState = {
    opsNavigationTitle: 'Home',
    showOpsBackButton: false,
    mainContentScrollIsAtBottom: false,
    showAddMerchantAlert: false
}

const opsNavigationSlice = createSlice({
    name: 'snackbar',
    initialState: initialState,
    reducers: {
        setOpsNavigationTitle(state, { payload }: PayloadAction<string>) {
            state.opsNavigationTitle = payload
        },
        setShowOpsBackButton(state, { payload }: PayloadAction<boolean>) {
            state.showOpsBackButton = payload
        },
        setScrollIsAtBottom(state, { payload }: PayloadAction<boolean>) {
            state.mainContentScrollIsAtBottom = payload
        },
        setShowAddMerchantAlert(state, { payload }: PayloadAction<boolean>) {
            state.showAddMerchantAlert = payload
        }
    }
})

export const { setOpsNavigationTitle, setShowOpsBackButton, setScrollIsAtBottom, setShowAddMerchantAlert } =
    opsNavigationSlice.actions
export default opsNavigationSlice.reducer
