import * as React from 'react'
import { FadeInOnScroll } from '../animation/FadeInOnScroll'
// @ts-ignore
// import Fade from 'react-reveal/Fade'
import { SvgAppSplitItUpScreen } from '../svg/AppSplitItUpScreen'
import { TextGradient } from '../text/TextGradient'

export function ScheduledPaymentsValueProposition() {
    return (
        <FadeInOnScroll>
            <div className={'flex flex-row-break items-center justify-center'}>
                {/*<Fade bottom distance={'20px'}>*/}
                <div className={'flex-grow flex flex-col items-center justify-center w-full h-full m-8'}>
                    <div className={`flex flex-col`}>
                        <span
                            className={
                                'text-primary text-2xl md:text-3xl text-left mx-6 sm:mx-2 font-bold mb-2 md:mb-4 leading-8 pt-2 pb-2'
                            }
                            style={{ maxWidth: '600px' }}
                        >
                            Schedule recurring payments. Save time.
                        </span>
                        <span
                            className={'text-secondary text-md md:text-xl md:leading-relaxed text-left mx-6 sm:mx-2'}
                            style={{ maxWidth: '600px' }}
                        >
                            If you send or receive money on a schedule, Equater can keep you organized.
                            <br />
                            <br />
                            Use our scheduled payments feature to
                            <TextGradient>&nbsp;manage scheduled, recurring payments.</TextGradient>
                        </span>
                    </div>
                </div>
                {/*</Fade>*/}
                {/*<Fade bottom distance={'20px'}>*/}
                <div className={'flex-grow flex items-center justify-center w-full h-full'}>
                    <SvgAppSplitItUpScreen />
                </div>
                {/*</Fade>*/}
            </div>
        </FadeInOnScroll>
    )
}
