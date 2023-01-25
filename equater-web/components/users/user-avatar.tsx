import Image from 'next/image'
import { AppColor } from '../../constants/colors'
import { User } from '../../redux/slices/auth.slice'

interface Props {
    user: User
    background?: AppColor
}

// https://tailwindui.com/components/application-ui/elements/avatars
export function UserAvatar({ user, background }: Props) {
    if (user.preSignedPhotoDownloadUrl) {
        return (
            <span className="inline-block relative">
                <Image className="h-12 w-12 rounded-full" src={user.preSignedPhotoDownloadUrl} alt="" layout={'fill'} />
            </span>
        )
    }

    const color = background || AppColor.PRIMARY
    const colorClass = color == AppColor.PRIMARY ? 'bg-app-primary' : 'bg-app-secondary'

    return (
        <span className={`inline-flex items-center justify-center h-12 w-12 rounded-full ${colorClass}`}>
            <span className="text-lg font-medium leading-none text-white">
                {user.firstName.substring(0, 1) + user.lastName.substring(0, 1)}
            </span>
        </span>
    )
}
