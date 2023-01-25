import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
    user: User | null
    test: string
}

export interface User {
    uuid: string
    firstName: string
    lastName: string
    emailIsConfirmed: boolean
    dateTimeCreated: Date
    profilePhotoUploadCompleted: boolean
    preSignedPhotoDownloadUrl: string
    id: number
    email: string
    addressOne: string
    addressTwo: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    profilePhotoMimeType: string | null
    canReceiveFunds: boolean
}

export interface UserAccount {
    id: number
    userId: number
    accountId: string
    accountName: string
    accountSubType: string
    accountType: string
    institutionId: string
    institutionName: string
    isActive: boolean
    hasRemovedFundingSource: boolean
    dwollaFundingSourceId: string
    dateOfLastPlaidTransactionPull: Date
    isDefaultUsedForPayment: boolean
    plaidLinkToken: string
    dateTimePlaidLinkTokenExpires: Date
    requiresPlaidReAuthentication: boolean
    dateTimeCreated: Date
    institution: Institution
}

export interface Institution {
    id: number
    uuid: string
    institutionId: string
    name: string
    websiteUrl: string
    primaryColorHexCode: string
    logoUrl: string
}

const initialState: AuthState = {
    user: null,
    test: ''
}

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        setUser(state, { payload }: PayloadAction<User>) {
            state.user = payload
        }
    }
})

export const { setUser } = authSlice.actions

export default authSlice.reducer
