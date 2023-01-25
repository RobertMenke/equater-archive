import { NextPage } from 'next'
import { ReactNode } from 'react'
import * as React from 'react'
import Layout from '../../components/Layout'
import { FullPageRespectingLayout } from '../../components/layout/full-page-respecting-layout'
import { SvgCardObjectColor } from '../../components/svg/SvgCardObjectColor'
import { SvgCheckBlendFilled } from '../../components/svg/SvgCheckBlendFilled'
import { SvgMoneyObjectColor } from '../../components/svg/SvgMoneyObjectColor'
import { SvgPhoneBlendFilled } from '../../components/svg/SvgPhoneBlendFilled'
import { SvgRepeatColorFilled } from '../../components/svg/SvgRepeatColorFilled'
import { SvgShoppingBagObjectColor } from '../../components/svg/SvgShoppingBagObjectColor'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    title: string
    subTitle: string
}

const PricingPage: NextPage<Props> = (props) => {
    return (
        <Layout>
            <FullPageRespectingLayout>
                <div className={'flex flex-col justify-center items-center mt-32'}>
                    <span className={'text-secondary text-base md:text-xl text-center'} style={{ maxWidth: '700px' }}>
                        An unbeatable price
                    </span>
                    <span className={'text-primary text-2xl md:text-4xl text-center font-bold'}>$0</span>
                </div>
                <div
                    className={'grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-16 pt-16 pb-16'}
                    style={{ margin: '0 auto' }}
                >
                    <PricingDescriptor
                        icon={<SvgPhoneBlendFilled />}
                        description={'Download the app & sign up (no cc required)'}
                        price={'Free'}
                    />
                    <PricingDescriptor
                        icon={<SvgCheckBlendFilled />}
                        description={'Receive money from others'}
                        price={'Free'}
                    />
                    <PricingDescriptor
                        icon={<SvgShoppingBagObjectColor />}
                        description={'Create a shared merchant expense'}
                        price={'Free'}
                    />
                    <PricingDescriptor
                        icon={<SvgCardObjectColor />}
                        description={'Detailed transaction history, undo transactions'}
                        price={'Free'}
                    />
                    <PricingDescriptor
                        icon={<SvgRepeatColorFilled />}
                        description={'Set up a recurring payment'}
                        price={'Free'}
                    />
                    <PricingDescriptor
                        icon={<SvgMoneyObjectColor />}
                        description={'Make a payment to a friend'}
                        price={'Free'}
                    />
                </div>
            </FullPageRespectingLayout>
        </Layout>
    )
}

interface PricingProps {
    icon: ReactNode
    description: string
    price: string
}

function PricingDescriptor(props: PricingProps) {
    return (
        <div className={'flex flex-row justify-start items-center mb-8'}>
            {props.icon}
            <div className={'flex flex-col justify-center items-start ml-2'}>
                <span className={'text-secondary text-sm'}>{props.description}</span>
                <span className={'text-primary text-xl'}>{props.price}</span>
            </div>
        </div>
    )
}

export default PricingPage
