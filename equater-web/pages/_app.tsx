// _app.js is a next.js convention that creates a wrapper around any pages
import Head from 'next/head'
import React, { FC } from 'react'
import { AppProps } from 'next/app'
import { wrapper } from '../redux/config'
import { Provider } from 'react-redux'
import { CookiesProvider } from 'react-cookie'
import '../styles/index.css'
import 'react-toastify/dist/ReactToastify.css'

//https://github.com/kirill-konshin/next-redux-wrapper
const App: FC<AppProps> = ({ Component, ...rest }) => {
    const { store, props } = wrapper.useWrappedStore(rest)

    return (
        <>
            <Head>
                <title>Equater</title>
            </Head>
            <Provider store={store}>
                <CookiesProvider>
                    <title>Equater</title>
                    <Component {...props.pageProps} />
                </CookiesProvider>
            </Provider>
        </>
    )
}

export default App
