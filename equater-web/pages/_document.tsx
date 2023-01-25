import Document, { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'
import React from 'react'

//https://nextjs.org/docs/advanced-features/custom-document
class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    {/*Google analytics*/}
                    <Script src="https://www.googletagmanager.com/gtag/js?id=UA-149965894-1" strategy={'lazyOnload'} />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                            window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments) }
                            gtag('js', new Date()) 
                            gtag('config', 'UA-155029097-1')
                        `
                        }}
                    />

                    {/*Basic meta tags*/}
                    <meta name="title" content="Equater" />
                    <meta
                        name="description"
                        content="Equater helps split shared expenses like rent or software subscriptions automatically"
                    />
                    <meta
                        name="keywords"
                        content="payments,rent,sharing,bills,pay,split the bill,banking,ach,debit card,credit card,merchant,vendor,apartment,share rent"
                    />
                    <meta name="robots" content="index, follow" />
                    <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="language" content="English" />
                    {/*Open Graph Tags*/}
                    <meta property={'og:title'} content={'Shared Bills & Recurring Payments'} />
                    <meta
                        property={'og:description'}
                        content={
                            'Equater helps split shared, recurring expenses like rent, utilities, or software subscriptions automatically'
                        }
                    />
                    <meta property={'og:image'} content={'https://equater.app/static/images/equater-logo.png'} />
                    <meta property={'og:url'} content={'https://equater.app'} />
                    {/*Favicon*/}
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                    <link rel="manifest" href="/site.webmanifest" />
                    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#7A04EB" />
                    <meta name="msapplication-TileColor" content="#101213" />
                    <meta name="theme-color" content="#101213" />

                    {/*Fonts*/}
                    <link href="https://fonts.googleapis.com/css2?family=Inter&display=optional" rel="stylesheet" />
                    <link href="https://fonts.googleapis.com/css?family=Lexend+Zetta&display=swap" rel="stylesheet" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
