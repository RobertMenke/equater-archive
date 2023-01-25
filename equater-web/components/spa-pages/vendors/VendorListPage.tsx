import * as React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { AppDispatch, State } from '../../../redux/config'
import {
    OpsNavigationState,
    setOpsNavigationTitle,
    setShowOpsBackButton
} from '../../../redux/slices/ops-navigation.slice'
import {
    fetchVendorPage,
    fetchVendorsThatRequireReview,
    setSelectedVendor,
    setVendorSearchIsLoading,
    setVendorSearchResults
} from '../../../redux/slices/transaction.slice'
import { CircularSpinner } from '../../feedback/CircularSpinner'
import { NoSearchResults } from '../../feedback/no-search-results'
import Snackbar from '../../feedback/Snackbar'
import { VendorRow } from '../../transactions/vendor-row'
import { VendorSearch } from '../../transactions/vendor-search'

export function VendorListPage() {
    const dispatch: AppDispatch = useDispatch()
    const navigate = useNavigate()
    const [searchInput, setSearchInput] = useState('')
    const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
    const { mainContentScrollIsAtBottom } = useSelector<State, OpsNavigationState>((state) => state.opsNavigationState)
    const {
        isLoading,
        vendorsThatRequireInternalReview,
        reviewedVendors,
        vendorSearchResults,
        showVendorsThatRequireReview,
        searchValue,
        showNoResults,
        nextVendorPage
    } = useSelector((state: State) => state.transaction)

    ////////////////////////////
    // On mount, fetch vendors
    ////////////////////////////
    useEffect(() => {
        dispatch(fetchVendorsThatRequireReview())
        dispatch(fetchVendorPage())
        dispatch(setOpsNavigationTitle('Merchant Identification'))
        dispatch(setShowOpsBackButton(false))
        ReactTooltip.rebuild()
    }, [])

    ////////////////////////////
    // Lazy-load vendors
    ////////////////////////////
    useEffect(() => {
        if (mainContentScrollIsAtBottom && !isLoadingNextPage && nextVendorPage) {
            setIsLoadingNextPage(true)
            dispatch(
                fetchVendorPage((err) => {
                    console.log(err)
                    setIsLoadingNextPage(false)
                })
            )
        }
    }, [mainContentScrollIsAtBottom])

    function getVendorList() {
        if (vendorSearchResults.length > 0 || searchValue.trim().length !== 0) {
            return vendorSearchResults
        }

        if (showVendorsThatRequireReview) {
            return vendorsThatRequireInternalReview
        }

        return reviewedVendors
    }

    function shouldShowNoResults() {
        if (isLoading) {
            return false
        }

        if (showVendorsThatRequireReview) {
            return showNoResults && searchValue.trim().length !== 0
        }

        return reviewedVendors.length === 0
    }

    const vendorList = getVendorList()

    return (
        <>
            <div className={'mx-2 md:mx-8'}>
                <VendorSearch
                    autoFocus={true}
                    inputValue={searchInput}
                    setInputValue={setSearchInput}
                    showVendorsThatRequireInternalReview={showVendorsThatRequireReview}
                    showFilters={true}
                    onSearchResults={(vendors) => {
                        dispatch(setVendorSearchResults(vendors))
                    }}
                    onIsLoading={(vendorSearchIsLoading) => {
                        dispatch(setVendorSearchIsLoading(vendorSearchIsLoading))
                    }}
                />
                {shouldShowNoResults() && <NoSearchResults message={'No Search Results'} />}
                {vendorList.map((vendor) => (
                    <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        onRowClicked={(vendor) => {
                            dispatch(setSelectedVendor(null))
                            navigate(`/dashboard/vendors/${vendor.id}`)
                        }}
                    />
                ))}
                {(isLoadingNextPage || isLoading) && (
                    <div className={'my-8 flex justify-center'}>
                        <CircularSpinner />
                    </div>
                )}
            </div>
            {/*</DashboardLayout>*/}
            <Snackbar />
        </>
    )
}
