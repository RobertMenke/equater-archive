import { default as React, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppDispatch } from '../../redux/config'
import { patchVendor, Vendor } from '../../redux/slices/transaction.slice'
import { Section } from '../layout/section'
import { Button, ButtonRole } from '../tailwind-ui/input/button'
import { CheckboxSection } from '../tailwind-ui/input/checkbox-section'
import { EditVendorPhoto } from './edit-vendor-photo'
import { TextField } from '../tailwind-ui/input/text-field'
import { VendorMenu } from './vendor-row'

interface Props {
    vendor: Vendor
}

export function EditVendorAttributes(props: Props) {
    const vendor = props.vendor

    useEffect(() => {
        setCurrentPhoto(vendor.logoUrl)
        setIdentityCannotBeDetermined(vendor.vendorIdentityCannotBeDetermined)
        setFriendlyName(vendor.friendlyName || '')
        setPpdId(vendor.ppdId || '')
        setPreProcessedLogoUploaded(false)
    }, [vendor])

    const dispatch: AppDispatch = useDispatch()
    const navigate = useNavigate()
    const [loading, setIsLoading] = useState(false)
    const [currentPhoto, setCurrentPhoto] = useState(vendor.logoUrl)
    const [identityCannotBeDetermined, setIdentityCannotBeDetermined] = useState(
        vendor.vendorIdentityCannotBeDetermined
    )
    const [friendlyName, setFriendlyName] = useState(vendor.friendlyName || '')
    const [ppdId, setPpdId] = useState(vendor.ppdId || '')
    const [preProcessedLogoUploaded, setPreProcessedLogoUploaded] = useState(false)

    return (
        <Section
            title={'Edit Attributes'}
            rightAlignedAction={
                <VendorMenu
                    vendor={vendor}
                    isRightAligned={true}
                    onUpdated={(patchedVendor) => {
                        if (patchedVendor.vendorIdentityCannotBeDetermined) {
                            toast('Vendor has been deleted')
                            navigate(-1)
                        }

                        if (patchedVendor.hasBeenReviewedInternally && !vendor?.hasBeenReviewedInternally) {
                            toast(`${vendor?.friendlyName} will now show up in the app`)
                        }
                    }}
                />
            }
        >
            <div className={'grid grid-rows-5 grid-flow-col gap-2 mt-4'}>
                <EditVendorPhoto
                    currentPhotoLink={currentPhoto}
                    vendor={vendor}
                    onFileUploaded={(photo) => {
                        setCurrentPhoto(photo)
                        setPreProcessedLogoUploaded(true)
                    }}
                />
                <TextField label={'Friendly Name'} value={friendlyName} handleChange={setFriendlyName} />
                <TextField label={'PPD ID'} value={ppdId} handleChange={setPpdId} />
                <div className={'flex md:w-6/12'}>
                    <CheckboxSection
                        id={'identity-determined'}
                        checked={identityCannotBeDetermined}
                        labelText={"Identity Can't Be Determined"}
                        descriptionText={
                            'Check this box if the identity of the vendor cannot be determined. This vendor will be excluded from search results and will not be eligible for expense sharing agreements.'
                        }
                        onChanged={setIdentityCannotBeDetermined}
                    />
                </div>
                <div className={'flex flex-row justify-start items-center'}>
                    <Button
                        role={ButtonRole.PRIMARY}
                        onClick={() => {
                            if (friendlyName.trim().length === 0) {
                                return toast('All vendors must have a name')
                            }

                            if (!vendor) {
                                return toast('A unexpected state was encountered. Please refresh the page to continue.')
                            }

                            dispatch(
                                patchVendor(
                                    vendor,
                                    {
                                        friendlyName: friendlyName,
                                        preProcessedLogoWasUploaded: preProcessedLogoUploaded,
                                        ppdId: ppdId,
                                        vendorIdentityCannotBeDetermined: identityCannotBeDetermined
                                    },
                                    setIsLoading
                                )
                            )
                        }}
                        text={'Save'}
                        isLoading={loading}
                    />
                </div>
            </div>
        </Section>
    )
}
