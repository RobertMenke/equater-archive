import * as React from 'react'
import { Vendor } from '../../redux/slices/transaction.slice'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    vendor: Vendor | null
}

export function AgreementAvatar({ vendor, onClick }: Props) {
    return (
        <div className={`flex flex-col relative items-center justify-center`} onClick={onClick}>
            {vendor?.logoUploadCompleted && vendor.logoUrl && (
                <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                    <img className={'h-full w-full'} src={vendor.logoUrl} alt={vendor.friendlyName} />
                </span>
            )}

            {!vendor && (
                <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                    <img
                        className={'h-full w-full'}
                        src={'/static/images/clock-icon-white-clipped.png'}
                        alt={'clock-icon'}
                    />
                </span>
            )}
        </div>
    )
}
