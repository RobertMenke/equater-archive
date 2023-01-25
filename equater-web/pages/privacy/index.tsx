import { NextPage } from 'next'
import * as React from 'react'
import Layout from '../../components/Layout'
import { FullPageRespectingLayout } from '../../components/layout/full-page-respecting-layout'
import { PrivacyPolicy } from '../../components/legal/PrivacyPolicy'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    title: string
    subTitle: string
}

const PrivacyPolicyPage: NextPage<Props> = (props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <PrivacyPolicy />
            </FullPageRespectingLayout>
        </Layout>
    )
}

export default PrivacyPolicyPage
