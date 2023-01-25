import { GetServerSideProps, NextPage } from 'next'
import fetch from 'isomorphic-unfetch'
import * as React from 'react'
import Layout from '../../components/Layout'
import { FullPageRespectingLayout } from '../../components/layout/full-page-respecting-layout'
import { SERVER_API_DOMAIN } from '../../constants/environment'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    title: string
    subTitle: string
}

const ConfirmEmail: NextPage<Props> = (props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <div className={'flex flex-col items-center justify-center h-full m-8'}>
                    <span className={'text-primary text-2xl md:text-4xl text-center font-bold'}>{props.title}</span>
                    <span className={'text-secondary text-base md:text-xl text-center'} style={{ maxWidth: '700px' }}>
                        {props.subTitle}
                    </span>
                </div>
            </FullPageRespectingLayout>
        </Layout>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const response = await fetch(`${SERVER_API_DOMAIN}/api/auth/verify-email/${context.params?.token}`)

    if (response.status === 200) {
        return {
            props: {
                title: 'Your Email Is Confirmed.',
                subTitle: 'Head back into the app to start splitting up payments.'
            }
        }
    }

    return {
        props: {
            title: 'Invalid Link',
            subTitle: 'This link is either invalid, expired, or has already been used'
        }
    }
}

export default ConfirmEmail
