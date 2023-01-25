import { NextPage } from 'next'
import * as React from 'react'
import Layout from '../../components/Layout'
import { FullPageRespectingLayout } from '../../components/layout/full-page-respecting-layout'
import { TermsOfService } from '../../components/legal/TermsOfService'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    title: string
    subTitle: string
}

const TermsOfServicePage: NextPage<Props> = (props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <TermsOfService />
            </FullPageRespectingLayout>
        </Layout>
    )
}

export default TermsOfServicePage
