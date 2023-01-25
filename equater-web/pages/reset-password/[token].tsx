import * as React from 'react'
import { GetServerSideProps, NextPage } from 'next'
import Layout from '../../components/Layout'
import PasswordReset from '../../components/password-reset/PasswordReset'
import { BaseProps } from '../../types/BaseProps'
import Snackbar from '../../components/feedback/Snackbar'

interface Props extends BaseProps {
    token: string
}

const ResetPassword: NextPage<Props> = (props) => {
    return (
        <>
            <Layout>
                <PasswordReset
                    title={'Reset Your Password'}
                    subTitle={'Use the input below to pick a password using 12 or more characters.'}
                    resetToken={props.token}
                />
            </Layout>
            <Snackbar />
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return {
        props: {
            token: context.query?.token
        }
    }
}

export default ResetPassword
