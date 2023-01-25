import { ServerResponse } from 'http'
import { withIronSessionSsr } from 'iron-session/next'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { AgreementDetailPage } from '../../components/agreements/AgreementDetailPage'
import { KeyboardShortcutHint } from '../../components/feedback/KeyboardShortcutHint'
import { AddMerchant } from '../../components/merchant/add-merchant'
import { DashboardHomePage } from '../../components/spa-pages/DashboardHomePage'
import { DevDashboard } from '../../components/spa-pages/dev'
import { NotFound } from '../../components/spa-pages/NotFound'
import { VendorDetailPage } from '../../components/spa-pages/vendors/VendorDetailPage'
import { VendorListPage } from '../../components/spa-pages/vendors/VendorListPage'
import { DashboardLayout } from '../../components/tailwind-ui/sidebar_layout/dashboard-layout'
import { TransactionDetailPage } from '../../components/transactions/TransactionDetailPage'
import { UserDetailPage } from '../../components/users/UserDetailPage'
import { UserListPage } from '../../components/users/UserListPage'
import { WatchlistPage } from '../../components/watchlist/WatchlistPage'
import { SERVER_API_DOMAIN, sessionOptions } from '../../constants/environment'
import { AppDispatch, State } from '../../redux/config'
import { setUser, User } from '../../redux/slices/auth.slice'
import { OpsNavigationState, setShowAddMerchantAlert } from '../../redux/slices/ops-navigation.slice'
import { TooltipState } from '../../redux/slices/tooltip.slice'
import { setAxiosMiddleware } from '../../services/http'
import { BaseProps } from '../../types/BaseProps'
import isHotkey from 'is-hotkey'
import axios from 'axios'

interface Props extends BaseProps {
    authToken: string
    user: User
}

const isCreateVendorHotkey = isHotkey('mod+shift+c')
const isEscape = isHotkey('escape')

function App(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const { opsNavigationTitle, showOpsBackButton, showAddMerchantAlert } = useSelector<State, OpsNavigationState>(
        (state) => state.opsNavigationState
    )
    const { description, keys } = useSelector<State, TooltipState>((state) => state.tooltipState)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setAxiosMiddleware(props.authToken)
        dispatch(setUser(props.user))
        setIsMounted(true)
        document.addEventListener('keydown', onKeyDown)
        redirectToHttpsHack()
    }, [])

    // Next currently lacks a way to force redirects to https without either a reverse proxy
    // or custom server. They typically recommend avoiding a custom server as it prevents
    // them from performing certain optimizations. This dashboard requires interaction with S3 that
    // must be performed over https. Until next implements this feature we're going to use this
    // ugly client-side hack :/.
    function redirectToHttpsHack() {
        if (typeof window !== typeof undefined && window.location.protocol === 'http:') {
            window.location.href = window.location.href.replace('http:', 'https:')
        }
    }

    function onKeyDown(e: KeyboardEvent) {
        if (isCreateVendorHotkey(e)) {
            e.preventDefault()
            dispatch(setShowAddMerchantAlert(true))
        }

        if (isEscape(e)) {
            dispatch(setShowAddMerchantAlert(false))
        }
    }

    if (!isMounted) {
        return null
    }

    return (
        <>
            <Router>
                <DashboardLayout title={opsNavigationTitle} showBackButton={showOpsBackButton}>
                    <Routes>
                        <Route path={'/dashboard'} element={<DashboardHomePage />} />
                        <Route path={'/dashboard/users'} element={<UserListPage />} />
                        <Route path={'/dashboard/watchlist'} element={<WatchlistPage />} />
                        <Route path={'/dashboard/users/:id'} element={<UserDetailPage />} />
                        <Route path={'/dashboard/agreement/:id'} element={<AgreementDetailPage user={props.user} />} />
                        <Route path={'/dashboard/vendors'} element={<VendorListPage />} />
                        <Route path={'/dashboard/vendors/:id'} element={<VendorDetailPage />} />
                        <Route path={'/dashboard/transaction/:id'} element={<TransactionDetailPage />} />
                        {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && (
                            <Route path={'/dashboard/dev'} element={<DevDashboard />} />
                        )}
                        <Route path={'*'} element={<NotFound />} />
                    </Routes>
                    <AddMerchant
                        isVisible={showAddMerchantAlert}
                        setIsVisible={(isVisible) => dispatch(setShowAddMerchantAlert(isVisible))}
                    />
                </DashboardLayout>
            </Router>
            <ReactTooltip id={'main'} className={'bg-app-secondary text-primary'} place={'bottom'} effect={'solid'} />
            <ReactTooltip
                id={'keyboard-shortcut'}
                className={'bg-app-primary text-primary invisible sm:visible'}
                place={'bottom'}
                effect={'solid'}
                backgroundColor={'#272B2F'}
            >
                <KeyboardShortcutHint description={description} keys={keys} />
            </ReactTooltip>
        </>
    )
}

// https://nextjs.org/docs/authentication#authenticating-server-rendered-pages
export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
    const authToken = req.session.authToken

    if (!authToken) {
        req.session.attemptedUrlBeforeSignIn = req.url
        await req.session.save()
        return redirectToSignIn(res)
    }

    try {
        // This will verify the user's JWT and throw if it's expired
        const verifiedUserResponse = await axios.get<User>(`${SERVER_API_DOMAIN}/api/user`, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        })

        return {
            props: {
                user: verifiedUserResponse.data,
                authToken
            }
        }
    } catch (e) {
        console.error(e)
        return redirectToSignIn(res)
    }
}, sessionOptions)

function redirectToSignIn(res: ServerResponse) {
    res.setHeader('location', '/sign-in')
    res.statusCode = 302

    return { props: {} }
}

export default App
