import * as React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../../../redux/config'

export function ProfileMenuItem() {
    const { user } = useSelector((state: State) => state.auth || {})

    if (!user) {
        return null
    }

    return (
        <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <a href="#" className="flex-shrink-0 group block">
                <div className="flex items-center">
                    <div>
                        <img
                            className="inline-block h-10 w-10 rounded-full"
                            src={user?.preSignedPhotoDownloadUrl}
                            alt=""
                        />
                    </div>
                    <div className="ml-3">
                        <p className="text-base leading-6 font-medium text-white">
                            ${user?.firstName} ${user?.lastName}
                        </p>
                        <p className="text-sm leading-5 font-medium text-gray-400 group-hover:text-gray-300 transition ease-in-out duration-150">
                            View profile
                        </p>
                    </div>
                </div>
            </a>
        </div>
    )
}
