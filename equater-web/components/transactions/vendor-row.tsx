import { Link } from 'react-router-dom'
import { useState } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, State } from '../../redux/config'
import {
    patchVendor,
    TransactionState,
    Vendor,
    setVendorsThatRequireInternalReview
} from '../../redux/slices/transaction.slice'
import { BaseProps } from '../../types/BaseProps'
import { formatDateVerbose } from '../../utils/date.utils'
import { StoreIcon } from '../icons/hero-icons/store-icon'
import { ArrowRightBold } from '../icons/shape-so/arrow-right-bold'
import { FileSuccessIcon } from '../icons/shape-so/file-success-icon'
import { TrashRemoveIcon } from '../icons/shape-so/trash-remove-icon'
import { WarningBlend } from '../icons/shape-so/warning-blend'
import { IconMenu } from '../tailwind-ui/menu/icon-menu'
import { IconMenuItem } from '../tailwind-ui/menu/icon-menu-item'

interface Props extends BaseProps {
    vendor: Vendor
    onRowClicked?: (vendor: Vendor) => void | Promise<void>
    RightJustifiedIcon?: React.ReactElement
    backgroundColor?: string
}

export function VendorRow({ vendor, onRowClicked, RightJustifiedIcon, backgroundColor }: Props) {
    const dateAdded = formatDateVerbose(new Date(Date.parse(vendor.dateTimeAdded)))
    const state = useSelector<State, TransactionState>((state) => state.transaction)
    const dispatch: AppDispatch = useDispatch()

    return (
        <Link
            to={`/dashboard/vendors/${vendor.id}`}
            onClick={(e) => {
                if (onRowClicked) {
                    e.preventDefault()
                    e.stopPropagation()
                    onRowClicked(vendor)
                }
            }}
        >
            <div
                className={`${
                    backgroundColor || 'bg-app-primary'
                } hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
            >
                <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                    {!vendor.hasBeenReviewedInternally && (
                        <VendorMenu
                            vendor={vendor}
                            onUpdated={() => {
                                const updatedVendorList = state.vendorsThatRequireInternalReview.filter(
                                    (toReview) => toReview.id !== vendor.id
                                )
                                dispatch(setVendorsThatRequireInternalReview(updatedVendorList))
                            }}
                        />
                    )}
                    <div className={`flex flex-col relative items-center justify-center`}>
                        {vendor?.logoUploadCompleted && vendor.logoUrl && (
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                                <img className={'object-fill'} src={vendor.logoUrl} alt={vendor.friendlyName} />
                            </span>
                        )}
                        {!vendor.logoUploadCompleted && vendor.hasBeenReviewedInternally && (
                            <StoreIcon additionalClassNames={`theme-dark text-gray-400`} />
                        )}
                        {!vendor.hasBeenReviewedInternally && !vendor?.logoUploadCompleted && <WarningBlend />}
                    </div>

                    <div className={`flex flex-col items-start p-4`}>
                        <span className={`text-gray-400 font-bold text-md`}>{vendor.friendlyName}</span>
                        <span className={`text-gray-500 font-thin text-sm`}>{`Date added: ${dateAdded}`}</span>
                        <span className={`text-gray-500 font-thin text-sm`}>{`PPD ID: ${
                            vendor.ppdId ? vendor.ppdId : 'Missing'
                        }`}</span>
                    </div>
                </div>
                <div className={`mr-4`}>
                    {RightJustifiedIcon ? RightJustifiedIcon : <ArrowRightBold color={`#cbd5e0`} className={`h-24`} />}
                </div>
            </div>
        </Link>
    )
}

interface VendorMenuProps {
    vendor: Vendor
    onUpdated: (vendor: Vendor) => void
    isRightAligned?: boolean
}

export function VendorMenu({ vendor, onUpdated, isRightAligned }: VendorMenuProps) {
    const [markSuccessIsLoading, setMarkSuccessIsLoading] = useState(false)
    const [markRemoveIsLoading, setMarkRemoveIsLoading] = useState(false)
    const dispatch: AppDispatch = useDispatch()
    const rightAligned = isRightAligned || false
    const [isOpen, setIsOpen] = useState(false)

    return (
        <IconMenu
            isRightAligned={rightAligned}
            buttonClassName={'p-4'}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            menuStyle={{ width: '300px' }}
        >
            {!vendor.hasBeenReviewedInternally && (
                <IconMenuItem
                    icon={<FileSuccessIcon />}
                    text={'Save as reviewed'}
                    isLoading={markSuccessIsLoading}
                    className={'hover:bg-app-secondary-dark'}
                    onClick={async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMarkSuccessIsLoading(true)
                        dispatch(
                            patchVendor(
                                vendor,
                                {
                                    friendlyName: vendor.friendlyName,
                                    preProcessedLogoWasUploaded: false,
                                    ppdId: vendor.ppdId,
                                    vendorIdentityCannotBeDetermined: false
                                },
                                setMarkSuccessIsLoading,
                                (vendor) => {
                                    setIsOpen(false)
                                    onUpdated(vendor)
                                }
                            )
                        )
                    }}
                />
            )}
            <IconMenuItem
                icon={<TrashRemoveIcon />}
                text={'Delete Vendor'}
                isLoading={markRemoveIsLoading}
                className={'hover:bg-app-secondary-dark'}
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMarkRemoveIsLoading(true)
                    dispatch(
                        patchVendor(
                            vendor,
                            {
                                friendlyName: vendor.friendlyName,
                                preProcessedLogoWasUploaded: false,
                                ppdId: vendor.ppdId,
                                vendorIdentityCannotBeDetermined: true
                            },
                            setMarkRemoveIsLoading,
                            onUpdated
                        )
                    )
                }}
            />
        </IconMenu>
    )
}
