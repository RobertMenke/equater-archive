import { NextPage } from 'next'
import Layout from '../../../components/Layout'
import { FullPageRespectingLayout } from '../../../components/layout/full-page-respecting-layout'
import { Button, ButtonRole } from '../../../components/tailwind-ui/input/button'

interface Props {}

export const OAuthRedirect: NextPage<Props> = (props: Props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <div
                    className={
                        'flex flex-col full-page-within-layout relative text-primary items-center justify-center'
                    }
                >
                    <div className={'flex flex-col w-2/3 items-center justify-center'}>
                        <span className={'text-gray-400 text-2xl bold pb-2'}>Awkward... redirect didn't work</span>
                        <span className={'text-gray-500 text-md pb-4'}>Click or tap below to head back to the app</span>
                        <Button
                            onClick={() => (window.location.href = '/app')}
                            text={'Back to app'}
                            isLoading={false}
                            role={ButtonRole.PRIMARY}
                            style={{ width: '300px', height: '50px' }}
                        />
                    </div>
                </div>
            </FullPageRespectingLayout>
        </Layout>
    )
}

export default OAuthRedirect
