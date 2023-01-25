import * as React from 'react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppColor } from '../../constants/colors'
import { AppDispatch, State } from '../../redux/config'
import {
    assignToExistingVendor,
    setSelectedVendor,
    setVendorSearchValue,
    Vendor
} from '../../redux/slices/transaction.slice'
import { Section } from '../layout/section'
import { Alert, AlertType } from '../tailwind-ui/feedback/alert'
import { VendorRow } from './vendor-row'
import { VendorSearch } from './vendor-search'

export function AssignToExistingVendor() {
    const dispatch: AppDispatch = useDispatch()
    const { selectedVendor } = useSelector((state: State) => state.transaction)
    const [searchInput, setSearchInput] = useState('')
    const [vendorSearchResults, setVendorSearchResults] = useState<Vendor[]>([])
    const [alertIsShowing, setAlertIsShowing] = useState(false)
    const [existingVendor, setExistingVendor] = useState<Vendor | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    return (
        <Section
            title={'Assign To Existing Vendor'}
            subtitle={
                'Vendors can use different names on bank statements and also may not always supply their PPD ID. If this vendor should be associated with one we have already reviewed, make that association here.'
            }
        >
            <Alert
                visible={alertIsShowing}
                setIsVisible={setAlertIsShowing}
                onCancel={() => {
                    if (!isLoading) {
                        setAlertIsShowing(false)
                    }
                }}
                onConfirm={() => {
                    if (!isLoading && existingVendor && selectedVendor) {
                        setIsLoading(true)
                        dispatch(
                            assignToExistingVendor(selectedVendor, existingVendor, (err) => {
                                setIsLoading(false)
                                setAlertIsShowing(false)

                                if (!err) {
                                    dispatch(setSelectedVendor(existingVendor))
                                    dispatch(setVendorSearchValue(''))
                                    navigate(`/dashboard/vendors/${existingVendor.id}`, {
                                        replace: true
                                    })
                                }
                            })
                        )
                    }
                }}
                title={'Confirm your selection'}
                description={`Are you sure you want to associate all transactions using the name ${selectedVendor?.friendlyName} with ${existingVendor?.friendlyName}? This will associate all historical transactions with ${existingVendor?.friendlyName}. This action cannot be undone.`}
                alertType={AlertType.INFO}
                confirmationText={'Confirm'}
                isLoading={isLoading}
            />
            <VendorSearch
                autoFocus={false}
                inputValue={searchInput}
                setInputValue={setSearchInput}
                showVendorsThatRequireInternalReview={false}
                background={AppColor.PRIMARY}
                onSearchResults={(vendors) => {
                    setVendorSearchResults(vendors)
                }}
            />
            {vendorSearchResults
                .filter((vendor) => !selectedVendor || vendor.id !== selectedVendor.id)
                .map((vendor) => (
                    <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        onRowClicked={(vendor) => {
                            setExistingVendor(vendor)
                            setAlertIsShowing(true)
                        }}
                    />
                ))}
        </Section>
    )
}
