import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { AppColor } from '../../constants/colors'
import { AppDispatch } from '../../redux/config'
import { setOpsNavigationTitle, setShowOpsBackButton } from '../../redux/slices/ops-navigation.slice'
import { UserSearchView } from './user-search-view'

export function UserListPage() {
    const dispatch: AppDispatch = useDispatch()
    const navigate = useNavigate()

    ////////////////////////////
    // On mount, fetch vendors
    ////////////////////////////
    useEffect(() => {
        dispatch(setOpsNavigationTitle('Users'))
        dispatch(setShowOpsBackButton(false))
        ReactTooltip.rebuild()
    }, [])

    return (
        <div className={'mx-2 md:mx-8'}>
            <UserSearchView
                background={AppColor.SECONDARY}
                onUserSelected={(user) => {
                    navigate(`/dashboard/users/${user.id}`)
                }}
            />
        </div>
    )
}
