import axios, { AxiosError } from 'axios'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { TEXT_COLOR } from '../../constants/colors'
import { useFocus } from '../../hooks/useFocus'
import { AppDispatch, State } from '../../redux/config'
import {
    attemptAutomaticLogoUploadFromUnknownVendor,
    createNewVendor,
    PatchVendorResponse,
    setReviewedVendors,
    TransactionState,
    Vendor
} from '../../redux/slices/transaction.slice'
import { convertImageUrlToBuffer } from '../../utils/data.utils'
import { CircularSpinner } from '../feedback/CircularSpinner'
import { RefreshIcon } from '../icons/hero-icons/refresh-icon'
import { CameraIcon } from '../icons/shape-so/camera'
import { Alert, AlertType } from '../tailwind-ui/feedback/alert'
import { VendorRow } from '../transactions/vendor-row'
import { v4 as uuid } from 'uuid'

interface Props {
    isVisible: boolean
    setIsVisible: (isVisible: boolean) => void
}

enum LogoUploadMethod {
    BRANDFETCH,
    ATTACH_PHOTO,
    NONE
}

const initialMerchantState: Vendor = {
    id: 0,
    uuid: '',
    ppdId: null,
    dateTimeAdded: new Date().toISOString(), //iso date
    dateTimeModified: new Date().toISOString(), //iso date
    totalNumberOfExpenseSharingAgreements: 0,
    hasBeenReviewedInternally: true,
    vendorIdentityCannotBeDetermined: false,
    friendlyName: '',
    logoS3Bucket: null,
    logoS3Key: null,
    logoUrl: null,
    logoUploadCompleted: false
}

export function AddMerchant(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const { reviewedVendors } = useSelector<State, TransactionState>((state) => state.transaction)
    const [merchantPreview, setMerchantPreview] = useState<Vendor>({
        ...initialMerchantState,
        uuid: uuid()
    })

    const [logoUploadMethod, setLogoUploadMethod] = useState<LogoUploadMethod>(LogoUploadMethod.NONE)
    const [imageType, setImageType] = useState('')
    const [inputRef, setInputFocus] = useFocus<HTMLInputElement>()
    const [refreshInProgress, setRefreshInProgress] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        setInputFocus()
    }, [props.isVisible])

    async function handleLogoRefresh() {
        setRefreshInProgress(true)

        try {
            const response = await attemptAutomaticLogoUploadFromUnknownVendor(merchantPreview.friendlyName)
            setMerchantPreview({
                ...merchantPreview,
                uuid: response.data.uuid,
                logoUrl: response.data.preSignedUrl,
                logoS3Bucket: response.data.bucket,
                logoS3Key: response.data.key,
                logoUploadCompleted: true
            })
            setLogoUploadMethod(LogoUploadMethod.BRANDFETCH)
        } catch (e) {
            //@ts-ignore
            const err: AxiosError = e
            if (err.response?.status === 409) {
                toast(`${merchantPreview.friendlyName} is already a merchant in our system`)
            } else {
                toast(`Couldn't find a logo for ${merchantPreview.friendlyName}`)
            }
            console.error(e)
        }

        setRefreshInProgress(false)
    }

    async function uploadVendorPhotoFromFileUpload(vendor: Vendor, fileUrl: string) {
        try {
            const response = await axios.get<{ preSignedUploadUrl: string }>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${vendor.id}/logo-upload-url`
            )
            // To avoid the authorization header it's necessary to create a separate axios instance
            const axiosInstance = axios.create()
            axiosInstance.defaults.headers.common = {}
            const bytes = convertImageUrlToBuffer(fileUrl)
            await axiosInstance.put(response.data.preSignedUploadUrl, bytes, {
                headers: {
                    'Content-Type': imageType,
                    'Content-Encoding': 'base64'
                }
            })
            clearFileInput()
        } catch (e) {
            console.error(e)
            clearFileInput()
        }
    }

    async function handleMerchantCreation() {
        const friendlyName = merchantPreview.friendlyName
        const uuid = merchantPreview.uuid

        if (friendlyName.trim().length === 0 || uuid.length !== 36) {
            toast(`Missing name or UUID -- name ${friendlyName} -- uuid ${uuid}`)
            return
        }

        try {
            const response = await createNewVendor({ friendlyName, uuid })
            let vendor = response.data
            // Optimistic UI update
            props.setIsVisible(false)
            switch (logoUploadMethod) {
                // Case 1: We manually uploaded a logo
                case LogoUploadMethod.ATTACH_PHOTO:
                    vendor = await uploadAndProcessAttachedFile(vendor)
                    break
                // Case 2: We have a logo from brandfetch
                case LogoUploadMethod.BRANDFETCH:
                    vendor = await processVendorPhoto(vendor)
                    break
                // Case 3: No logo
                case LogoUploadMethod.NONE:
                    break
            }
            dispatch(setReviewedVendors([vendor, ...reviewedVendors]))
            toast(`Added ${merchantPreview.friendlyName} as a new vendor`)
            resetState()
        } catch (e) {
            console.error(e)
            toast(`Couldn't find a logo for ${merchantPreview.friendlyName}`)
        }
    }

    async function uploadAndProcessAttachedFile(vendor: Vendor): Promise<Vendor> {
        const fileUrl = merchantPreview.logoUrl

        if (!fileUrl) {
            toast(`Please attach an image first`)
            return vendor
        }

        await uploadVendorPhotoFromFileUpload(vendor, fileUrl)

        return await processVendorPhoto(vendor)
    }

    async function processVendorPhoto(vendor: Vendor): Promise<Vendor> {
        const { data } = await axios.patch<PatchVendorResponse>(
            `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${vendor.id}`,
            {
                friendlyName: vendor.friendlyName,
                preProcessedLogoWasUploaded: true,
                ppdId: vendor.ppdId,
                vendorIdentityCannotBeDetermined: false
            }
        )

        return data.vendor
    }

    function resetState() {
        clearFileInput()
        setMerchantPreview({ ...initialMerchantState, uuid: uuid() })
        setLogoUploadMethod(LogoUploadMethod.NONE)
        setImageType('')
        setRefreshInProgress(false)
    }

    function clearFileInput() {
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }, 0)
    }

    return (
        <Alert
            visible={props.isVisible}
            setIsVisible={props.setIsVisible}
            isLoading={false}
            title={`Add Merchant`}
            description={`Adds a new merchant to our database. This merchant will show up in the apps immediately, but we will have to be on the lookout for matching transactions since our name may not match up with Plaid's name.`}
            confirmationText={'Create'}
            onCancel={() => {
                resetState()
                props.setIsVisible(false)
            }}
            onConfirm={() => handleMerchantCreation().catch(console.error)}
            alertType={AlertType.CREATE}
        >
            <MerchantInput
                inputRef={inputRef}
                text={merchantPreview.friendlyName}
                setText={(text) => {
                    setMerchantPreview({ ...merchantPreview, friendlyName: text })
                }}
                refreshInProgress={refreshInProgress}
                onRefreshRequested={handleLogoRefresh}
            />
            <div className={'relative'}>
                <span className="absolute block text-sm font-medium text-gray-700" style={{ top: '-24px' }}>
                    Preview
                </span>
                <VendorRow
                    vendor={merchantPreview}
                    onRowClicked={() => {
                        fileInputRef.current?.click()
                    }}
                    RightJustifiedIcon={<CameraIcon strokeColor={TEXT_COLOR} />}
                    backgroundColor={'bg-app-secondary-dark mb-8 mt-8'}
                />
                <input
                    ref={fileInputRef}
                    className={'hidden'}
                    type={'file'}
                    onChange={(e) => {
                        const files = e.target.files
                        if (files) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                                // @ts-ignore
                                // uploadVendorPhoto(reader.result as string).catch(console.error)
                                setMerchantPreview({
                                    ...merchantPreview,
                                    logoUrl: reader.result as string,
                                    logoUploadCompleted: true
                                })
                                setImageType(files[0].type)
                                setLogoUploadMethod(LogoUploadMethod.ATTACH_PHOTO)
                            }
                            reader.readAsDataURL(files[0])
                        }
                    }}
                />
            </div>
        </Alert>
    )
}

interface MerchantProps {
    text: string
    setText: (text: string) => void
    refreshInProgress: boolean
    onRefreshRequested: (text: string) => void | Promise<void>
    inputRef: MutableRefObject<HTMLInputElement | null>
}

function MerchantInput(props: MerchantProps) {
    return (
        <div className={'mt-8'}>
            <div className="flex justify-between">
                <label htmlFor="add-merchant-input" className="block text-sm font-medium text-gray-700">
                    Merchant Name
                </label>
            </div>
            <div className="relative mt-1">
                <input
                    ref={props.inputRef}
                    type="text"
                    name="add-merchant-input"
                    id="add-merchant-input"
                    className="shadow-sm bg-app-secondary-dark text-primary focus:ring-accent-primary block w-full sm:text-sm border-app-primary rounded-md"
                    placeholder="Friendly name for the merchant"
                    value={props.text}
                    onChange={(e) => props.setText(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key.toLowerCase() === 'enter' && props.text.trim().length > 0) {
                            props.onRefreshRequested(props.text)
                        }
                    }}
                />
                <div
                    className={'absolute top-1/4 mr-8 cursor-pointer'}
                    style={{ left: 'calc(100% - 40px)' }}
                    onClick={() => {
                        if (props.text.trim().length > 0) {
                            props.onRefreshRequested(props.text)
                        }
                    }}
                >
                    {!props.refreshInProgress && <RefreshIcon strokeColor={TEXT_COLOR} className={'h-5 w-5'} />}
                    {props.refreshInProgress && <CircularSpinner />}
                </div>
            </div>
        </div>
    )
}
