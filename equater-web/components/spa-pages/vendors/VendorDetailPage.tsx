import { default as React, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../../redux/slices/ops-navigation.slice'
import Snackbar from '../../feedback/Snackbar'
import { AssignToExistingVendor } from '../../transactions/assign-to-existing-vendor'
import { AssociateParentCompanyOrSubsidiary } from '../../transactions/associate-parent-company-or-subsidiary'
import { EditVendorAttributes } from '../../transactions/edit-vendor-attributes'
import { ExistingVendorAssociations } from '../../transactions/existing-vendor-associations'
import { VendorTransactionSection } from '../../transactions/vendor-transaction-section'
import { AppDispatch, State } from '../../../redux/config'
import {
    fetchVendor,
    fetchVendorAssociation,
    setShowVendorsThatRequireReview
} from '../../../redux/slices/transaction.slice'

export function VendorDetailPage() {
    const dispatch: AppDispatch = useDispatch()
    const { selectedVendor, vendorAssociations } = useSelector((state: State) => state.transaction)
    const { id } = useParams()
    const vendorId = parseInt(id || '0', 10)

    useEffect(() => {
        dispatch(fetchVendor(vendorId))
        dispatch(setShowVendorsThatRequireReview(true))
        dispatch(setOpsNavigationTitle('Loading...'))
        dispatch(setShowOpsBackButton(true))
        ReactTooltip.rebuild()
    }, [id])

    useEffect(() => {
        if (selectedVendor) {
            dispatch(setOpsNavigationTitle(selectedVendor.friendlyName))
            dispatch(fetchVendorAssociation(selectedVendor))
        } else {
            dispatch(setOpsNavigationTitle('Loading...'))
        }
    }, [selectedVendor])

    if (!selectedVendor) {
        return null
    }

    return (
        <>
            <div className={'mx-2 md:mx-8'}>
                {selectedVendor && <EditVendorAttributes vendor={selectedVendor} />}
                <AssignToExistingVendor />
                {vendorAssociations.length > 0 && <ExistingVendorAssociations associations={vendorAssociations} />}
                <AssociateParentCompanyOrSubsidiary />
                <VendorTransactionSection />
            </div>
            <Snackbar />
        </>
    )
}
