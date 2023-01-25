import axios from 'axios'
import { useRef, useState } from 'react'
import { Vendor } from '../../redux/slices/transaction.slice'
import { convertImageUrlToBuffer } from '../../utils/data.utils'
import { CircularSpinner } from '../feedback/CircularSpinner'

interface Props {
    currentPhotoLink: string | null
    vendor: Vendor
    onFileUploaded: (fileUrl: string) => void
}

export function EditVendorPhoto(props: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageType, setImageType] = useState('')
    const [loading, setIsLoading] = useState(false)

    function clearFileInput() {
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }, 0)
    }

    async function uploadVendorPhoto(fileUrl: string) {
        try {
            const response = await axios.get<{ preSignedUploadUrl: string }>(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/vendor/${props.vendor.id}/logo-upload-url`
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
            props.onFileUploaded(fileUrl)
            clearFileInput()
            setIsLoading(false)
        } catch (e) {
            console.error(e)
            clearFileInput()
            setIsLoading(false)
        }
    }

    return (
        <div className={'relative pb-4'}>
            <label htmlFor="photo" className="block text-sm leading-5 font-medium text-gray-600">
                Photo
            </label>
            <div className="mt-2 flex items-center">
                {props.currentPhotoLink && (
                    <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                        <img className={'h-full w-full'} src={props.currentPhotoLink} alt={props.vendor.friendlyName} />
                    </span>
                )}
                {!props.currentPhotoLink && (
                    <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </span>
                )}
                <span className="ml-5 rounded-md shadow-sm">
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
                                    uploadVendorPhoto(reader.result as string).catch(console.error)
                                    setImageType(files[0].type)
                                }
                                setIsLoading(true)
                                reader.readAsDataURL(files[0])
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="py-2 px-3 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-500 hover:text-gray-500 focus:outline-none focus:border-app-accent focus:shadow-outline-blue active:bg-gray-50 active:text-gray-100 transition duration-150 ease-in-out"
                        onClick={() => {
                            fileInputRef.current?.click()
                        }}
                    >
                        {!loading && 'Change'}
                        {loading && <CircularSpinner />}
                    </button>
                </span>
            </div>
        </div>
    )
}
