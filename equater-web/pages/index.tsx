import * as React from 'react'
import AppSnackbar from '../components/feedback/Snackbar'
import { AllValuePropositions } from '../components/landing-page/AllValuePropositions'
import { SharedBillValueProposition } from '../components/landing-page/SharedBillValueProposition'
import { ScheduledPaymentsValueProposition } from '../components/landing-page/ScheduledPaymentsValueProposition'
import { WelcomeToEquater } from '../components/landing-page/WelcomeToEquater'
import Layout from '../components/Layout'
import { FullPageContainer } from '../components/layout/full-page-container'
import { BaseProps } from '../types/BaseProps'

interface Props extends BaseProps {}

const Index: React.FC<Props> = (props) => {
    return (
        <>
            <Layout>
                <FullPageContainer className={'border-b-1 border-app-secondary'}>
                    <WelcomeToEquater />
                </FullPageContainer>
                <FullPageContainer className={'border-b-1 border-app-secondary'}>
                    <SharedBillValueProposition />
                </FullPageContainer>
                <FullPageContainer className={'border-b-1 border-app-secondary'}>
                    <ScheduledPaymentsValueProposition />
                </FullPageContainer>
                <FullPageContainer className={'border-b-1 border-app-secondary'}>
                    <AllValuePropositions />
                </FullPageContainer>
            </Layout>
            <AppSnackbar />
        </>
    )
}

export default Index
