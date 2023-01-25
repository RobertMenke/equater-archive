import { useState } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, State } from '../../redux/config'
import {
    deleteVendorAssociation,
    setVendorAssociations,
    TransactionState,
    UniqueVendorAssociationType,
    VendorAssociationResponse
} from '../../redux/slices/transaction.slice'
import { StoreIcon } from '../icons/hero-icons/store-icon'
import { WarningBlend } from '../icons/shape-so/warning-blend'
import { SvgClose } from '../svg/SvgClose'
import { Alert, AlertType } from '../tailwind-ui/feedback/alert'

interface Props {
    association: VendorAssociationResponse
}

export function VendorAssociationRow({ association }: Props) {
    const dispatch: AppDispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(false)
    const [alertIsShowing, setAlertIsShowing] = useState(false)
    const { selectedVendor, vendorAssociations } = useSelector<State, TransactionState>((state) => state.transaction)

    if (!selectedVendor) {
        return null
    }

    const associatedVendor =
        association.vendor.id === selectedVendor.id ? association.associatedVendor : association.vendor

    function getRelationshipText(): string {
        switch (association.association.associationType) {
            case UniqueVendorAssociationType.OTHER:
                return `${selectedVendor?.friendlyName} has an unknown relationship with ${associatedVendor.friendlyName}`
            case UniqueVendorAssociationType.PARENT_COMPANY:
                return `${association.associatedVendor.friendlyName} is the parent company of ${association.vendor.friendlyName}`
            case UniqueVendorAssociationType.SUBSIDIARY_COMPANY:
                return `${association.vendor.friendlyName} is a subsidiary company of ${association.associatedVendor.friendlyName}`
        }
    }

    return (
        <div
            className={`theme-dark bg-app-primary shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
        >
            <Alert
                visible={alertIsShowing}
                setIsVisible={setAlertIsShowing}
                onCancel={() => {
                    if (!isLoading) {
                        setAlertIsShowing(false)
                    }
                }}
                onConfirm={async () => {
                    if (isLoading) {
                        return
                    }

                    setIsLoading(true)
                    try {
                        await deleteVendorAssociation(selectedVendor, association.association)
                        dispatch(
                            setVendorAssociations(
                                vendorAssociations.filter(
                                    (vendorAssociation) =>
                                        vendorAssociation.association.id !== association.association.id
                                )
                            )
                        )
                        setAlertIsShowing(false)
                    } catch (e) {
                        setAlertIsShowing(false)
                    }
                }}
                title={'Are you sure you want to delete this association?'}
                description={`Moving forward, shared bills related to these 2 vendors will only be settled when a transaction matches a vendor exactly.`}
                alertType={AlertType.INFO}
                confirmationText={'Confirm'}
                isLoading={isLoading}
            />
            <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                <div className={`flex flex-col relative items-center justify-center`}>
                    {associatedVendor?.logoUploadCompleted && associatedVendor.logoUrl && (
                        <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                            <img
                                className={'h-full w-full'}
                                src={associatedVendor.logoUrl}
                                alt={associatedVendor.friendlyName}
                            />
                        </span>
                    )}
                    {!associatedVendor.logoUploadCompleted && associatedVendor.hasBeenReviewedInternally && (
                        <StoreIcon additionalClassNames={`theme-dark text-gray-400`} />
                    )}
                    {!associatedVendor.hasBeenReviewedInternally && !associatedVendor?.logoUploadCompleted && (
                        <WarningBlend />
                    )}
                </div>

                <div className={`flex flex-col items-start p-4`}>
                    <span className={`text-gray-400 font-bold text-md`}>{associatedVendor.friendlyName}</span>
                    <span className={`text-gray-500 font-thin text-sm`}>{getRelationshipText()}</span>
                </div>
            </div>
            <div
                className={`mr-4 h-full p-4 cursor-pointer`}
                onClick={() => {
                    setAlertIsShowing(true)
                }}
            >
                <SvgClose />
            </div>
        </div>
    )
}
