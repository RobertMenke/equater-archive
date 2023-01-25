import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Currency } from 'dinero.js'
import { Dispatch } from 'react'
import { toast } from 'react-toastify'
import { State } from '../config'
import axios, { AxiosResponse, CancelToken } from 'axios'
import { User, UserAccount } from './auth.slice'

export interface Vendor {
    id: number
    uuid: string
    ppdId: null | string
    dateTimeAdded: string //iso date
    dateTimeModified: string | null //iso date
    totalNumberOfExpenseSharingAgreements: number
    hasBeenReviewedInternally: boolean
    vendorIdentityCannotBeDetermined: boolean
    friendlyName: string
    logoS3Bucket: string | null
    logoS3Key: string | null
    logoUrl: string | null
    logoUploadCompleted: boolean
}

export interface VendorAssociation {
    id: number
    uniqueVendorId: number
    associatedUniqueVendorId: number
    associationType: UniqueVendorAssociationType
    notes: string
}

export enum PlaidWebHookCode {
    INITIAL_UPDATE,
    HISTORICAL_UPDATE,
    DEFAULT_UPDATE,
    DIRECT_API_QUERY
}

export interface CurrencyRepresentation {
    amount: number
    currency: Currency
    precision: number
}

export interface Transaction {
    ///////////////////
    // Relationships
    ///////////////////
    accountId: number
    uniqueVendorId: number
    ///////////////////
    // Fields
    ///////////////////
    id: number
    categoryId: string
    pendingTransactionId: string
    transactionId: string
    accountOwner: string
    amount: number
    date: string //iso8601
    authorizedDate: string //iso8601
    dateTimeCaptured: string //iso8601
    isoCurrencyCode: string
    isPending: boolean
    transactionType: string
    unofficialCurrencyCode: string
    plaidWebHookCode: PlaidWebHookCode
    paymentChannel: string

    /////////////////////
    // Location meta data
    /////////////////////
    address: string | null
    city: string | null
    country: string | null
    latitude: number | null
    longitude: number | null
    postalCode: string | null
    region: string | null
    storeNumber: string | null

    /////////////////////
    // Payment meta data
    /////////////////////
    byOrderOf: string | null
    payee: string | null
    payer: string | null
    paymentMethod: string | null
    paymentProcessor: string | null
    ppdId: string | null
    reason: string | null
    referenceNumber: string | null
    transactionName: string | null
    merchantName: string | null
}

export interface PlaidTransactionContext {
    user: User
    account: UserAccount
    transaction: Transaction
    categoryContext: PlaidCategoryContext
}

export interface PlaidCategoryContext {
    categoryId: string
    categoryType: string
    description: string
}

export interface TransactionState {
    searchValue: string
    isLoading: boolean
    vendorsThatRequireInternalReview: Vendor[]
    reviewedVendors: Vendor[]
    vendorSearchResults: Vendor[]
    vendorAssociations: VendorAssociationResponse[]
    nextVendorPage: string | null
    transactions: Transaction[]
    showNoResults: boolean
    showVendorsThatRequireReview: boolean
    selectedVendor: Vendor | null
    editableSelectedVendor: Vendor | null
    error: string | null
}

const initialState: TransactionState = {
    searchValue: '',
    isLoading: false,
    vendorsThatRequireInternalReview: [],
    reviewedVendors: [],
    vendorSearchResults: [],
    vendorAssociations: [],
    nextVendorPage: `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor?page=0`,
    transactions: [],
    showNoResults: false,
    showVendorsThatRequireReview: true,
    selectedVendor: null,
    editableSelectedVendor: null,
    error: null
}

const transactionSlice = createSlice({
    name: 'transaction',
    initialState,
    reducers: {
        setVendorSearchValue(state, { payload }: PayloadAction<string>) {
            state.searchValue = payload
        },
        setVendorSearchIsLoading(state, { payload }: PayloadAction<boolean>) {
            state.isLoading = payload
        },
        setVendorsThatRequireInternalReview(state, { payload }: PayloadAction<Vendor[]>) {
            state.vendorsThatRequireInternalReview = payload
        },
        setReviewedVendors(state, { payload }: PayloadAction<Vendor[]>) {
            state.reviewedVendors = payload
        },
        setNextVendorPage(state, { payload }: PayloadAction<string | null>) {
            state.nextVendorPage = payload
        },
        setVendorSearchResults(state, { payload }: PayloadAction<Vendor[]>) {
            state.vendorSearchResults = payload
        },
        setVendorAssociations(state, { payload }: PayloadAction<VendorAssociationResponse[]>) {
            state.vendorAssociations = payload
        },
        setTransactions(state, { payload }: PayloadAction<Transaction[]>) {
            state.transactions = payload
        },
        setShouldShowNoResults(state, { payload }: PayloadAction<boolean>) {
            state.showNoResults = payload
        },
        setShowVendorsThatRequireReview(state, { payload }: PayloadAction<boolean>) {
            state.showVendorsThatRequireReview = payload
        },
        setSelectedVendor(state, { payload }: PayloadAction<Vendor | null>) {
            state.selectedVendor = payload
            state.editableSelectedVendor = payload ? { ...payload } : payload
        },
        setError(state, { payload }: PayloadAction<string>) {
            state.error = payload
        }
    }
})

export const {
    setVendorsThatRequireInternalReview,
    setReviewedVendors,
    setNextVendorPage,
    setVendorSearchResults,
    setVendorAssociations,
    setShowVendorsThatRequireReview,
    setSelectedVendor,
    setVendorSearchValue,
    setVendorSearchIsLoading,
    setShouldShowNoResults,
    setTransactions
} = transactionSlice.actions

export default transactionSlice.reducer

export interface VendorResponse {
    vendors: Vendor[]
}

export interface PatchVendorResponse {
    vendor: Vendor
}

export interface VendorAssociationResponse {
    associatedVendor: Vendor
    vendor: Vendor
    association: VendorAssociation
}

interface VendorPageResponse extends VendorResponse {
    nextPage: string | null
    previousPage: string | null
}

interface TransactionResponse {
    transactions: Transaction[]
}

export enum UniqueVendorAssociationType {
    OTHER = 'OTHER',
    PARENT_COMPANY = 'PARENT_COMPANY',
    SUBSIDIARY_COMPANY = 'SUBSIDIARY_COMPANY'
}

export function fetchVendorsThatRequireReview() {
    return async (dispatch: Dispatch<Vendor[]>, getState: () => State) => {
        try {
            const { data } = await axios.get<VendorResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/requires-internal-review`
            )
            // @ts-ignore
            dispatch(setVendorsThatRequireInternalReview(data.vendors))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
        }
    }
}

export function fetchVendorPage(onCompleted?: (e: Error | null) => void) {
    return async (dispatch: Dispatch<Vendor[]>, getState: () => State) => {
        const nextPage = getState().transaction.nextVendorPage

        if (!nextPage) {
            return
        }

        try {
            const { data } = await axios.get<VendorPageResponse>(nextPage)
            const currentVendorList = getState().transaction.reviewedVendors
            // @ts-ignore
            dispatch(setNextVendorPage(data.nextPage))
            // @ts-ignore
            dispatch(setReviewedVendors(currentVendorList.concat(data.vendors)))
            if (onCompleted) {
                onCompleted(null)
            }
        } catch (e) {
            const error = e as Error
            console.error(error.message)
            if (onCompleted) {
                onCompleted(error)
            }
        }
    }
}

interface PreSignedUploadUrlResponse {
    preSignedUploadUrl: string
}

interface GetVendorsResponse {
    vendors: Vendor[]
    nextPage: string | null
    previousPage: string | null
}

export function fetchVendors(page: number) {
    return async (dispatch: Dispatch<Vendor[]>, getState: () => State) => {
        try {
            const { data } = await axios.get<GetVendorsResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor?page=${page}`
            )
            // @ts-ignore
            dispatch(setReviewedVendors(data.vendors))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
        }
    }
}

// Since we can show vendor search results for multiple components on a single page, we pass them via a callback
// function so that state can be stored locally
export function searchVendors(
    searchTerm: string,
    showVendorsThatRequireInternalReview: boolean,
    cancelToken: CancelToken,
    onSearchResults: (list: Vendor[]) => void | Promise<void>
) {
    return async (dispatch: Dispatch<Vendor[]>, getState: () => State) => {
        try {
            searchTerm = encodeURIComponent(searchTerm)
            // @ts-ignore
            dispatch(setVendorSearchIsLoading(true))
            // @ts-ignore
            dispatch(setShouldShowNoResults(false))
            const { data } = await axios.get<VendorResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/search?searchTerm=${searchTerm}&requiringInternalReview=${showVendorsThatRequireInternalReview}`,
                {
                    cancelToken
                }
            )
            onSearchResults(data.vendors)
            // @ts-ignore
            dispatch(setVendorSearchIsLoading(false))
            // @ts-ignore
            dispatch(setShouldShowNoResults(data.vendors.length === 0))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            setVendorSearchIsLoading(false)
        }
    }
}

export function fetchVendor(id: number) {
    return async (dispatch: Dispatch<Vendor[]>, getState: () => State) => {
        try {
            const { data } = await axios.get<VendorResponse>(`${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${id}`)
            // @ts-ignore
            dispatch(setSelectedVendor(data.vendor))
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
        }
    }
}

export interface PatchVendorDto {
    friendlyName: string
    preProcessedLogoWasUploaded: boolean
    ppdId: string | null
    vendorIdentityCannotBeDetermined: boolean
}

export function patchVendor(
    vendor: Vendor,
    dto: PatchVendorDto,
    setIsLoading?: (isLoading: boolean) => void,
    onSuccess?: (vendor: Vendor) => void
) {
    return async (dispatch: Dispatch<Vendor>, getState: () => State) => {
        try {
            setIsLoading && setIsLoading(true)
            const { data } = await axios.patch<PatchVendorResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${vendor.id}`,
                dto
            )
            // @ts-ignore
            dispatch(setSelectedVendor(data.vendor))
            setIsLoading && setIsLoading(false)
            toast('Successfully updated vendor')
            onSuccess && onSuccess(vendor)
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            setIsLoading && setIsLoading(false)
            toast('Error occurred while updating vendor')
        }
    }
}

export function assignToExistingVendor(
    currentVendor: Vendor,
    existingVendor: Vendor,
    onFinished: (err: Error | null) => void
) {
    return async (dispatch: Dispatch<Vendor>, getState: () => State) => {
        try {
            const { data } = await axios.patch<VendorResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${currentVendor.id}/assign-to-existing-vendor/${existingVendor.id}`
            )
            onFinished(null)
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            toast('Error occurred attempting to assign vendor')
            //@ts-ignore
            onFinished(e)
        }
    }
}

export function associateParentOrSubsidiary(
    currentVendor: Vendor,
    existingVendor: Vendor,
    associationType: UniqueVendorAssociationType,
    notes: string,
    onFinished: (vendor: Vendor | null) => void
) {
    return async (dispatch: Dispatch<Vendor>, getState: () => State) => {
        try {
            const { data } = await axios.put<VendorAssociationResponse>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${currentVendor.id}/associate-with/${existingVendor.id}`,
                {
                    associationType,
                    notes
                }
            )
            onFinished(data.vendor)
        } catch (e) {
            //@ts-ignore
            console.error(e.message)
            toast('Error occurred attempting to associate vendor')
            onFinished(null)
        }
    }
}

export async function fetchTransactions(vendor: Vendor): Promise<PlaidTransactionContext[]> {
    try {
        const { data } = await axios.get<PlaidTransactionContext[]>(
            `${process.env.NEXT_PUBLIC_API_HOST}/api/transaction/vendor/${vendor.id}`
        )
        console.log(data)

        return data
    } catch (e) {
        //@ts-ignore
        console.error(e.message)

        return []
    }
}

export function fetchVendorAssociation(vendor: Vendor) {
    return async (dispatch: Dispatch<VendorAssociationResponse[]>, getState: () => State) => {
        try {
            const { data } = await axios.get<VendorAssociationResponse[]>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${vendor.id}/associations`
            )
            // @ts-ignore
            dispatch(setVendorAssociations(data))
        } catch (e) {
            console.error(e)
            toast('Could not fetch vendor associations')
        }
    }
}

export function deleteVendorAssociation(vendor: Vendor, association: VendorAssociation): Promise<AxiosResponse<void>> {
    return axios.delete(`${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${vendor.id}/associations/${association.id}`)
}

export function attemptAutomaticLogoUploadFromUnknownVendor(
    vendorName: string
): Promise<AxiosResponse<TemporaryLogoUploadResponse>> {
    return axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/logo-lookup?vendorName=${vendorName}`)
}

export function createNewVendor(dto: CreateVendorDto): Promise<AxiosResponse<Vendor>> {
    return axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/vendor`, dto)
}

export interface TemporaryLogoUploadResponse {
    preSignedUrl: string
    uuid: string
    key: string
    bucket: string
}

export interface CreateVendorDto {
    friendlyName: string
    uuid: string
}
