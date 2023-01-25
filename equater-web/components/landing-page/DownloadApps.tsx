import { BaseProps } from '../../types/BaseProps'
import { AppleAppStoreButton } from './AppleAppStoreButton'
import { GooglePlayStoreButton } from './GooglePlayStoreButton'

interface Props extends BaseProps {}

export function DownloadApps(props: Props) {
    return (
        <div className={`flex flex-col md:flex-row items-center justify-center mt-4 w-full ${props.className || ''}`}>
            <AppleAppStoreButton />
            <GooglePlayStoreButton />
        </div>
    )
}
