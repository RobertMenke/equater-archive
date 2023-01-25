import { NextPage } from 'next'
import Layout from '../../components/Layout'
import { FullPageRespectingLayout } from '../../components/layout/full-page-respecting-layout'

interface Props {}

const SupportPage: NextPage<Props> = (props: Props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <div
                    className={
                        'flex flex-col full-page-within-layout relative text-primary items-center justify-center'
                    }
                >
                    <div className={'flex flex-col w-64 items-center justify-center'}>
                        <span className={'text-gray-400 text-2xl bold'}>Call or Text</span>
                        <span className={'text-gray-500 text-md'}>{process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER}</span>
                    </div>
                    <div className={'h-px bg-gray-500 w-64 my-4'} />
                    <div className={'flex flex-col w-64 items-center justify-center'}>
                        <span className={'text-gray-400 text-2xl bold'}>Email</span>
                        <span className={'text-gray-500 text-md'}>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL_ADDRESS}</span>
                    </div>
                </div>
            </FullPageRespectingLayout>
        </Layout>
    )
}

export default SupportPage
