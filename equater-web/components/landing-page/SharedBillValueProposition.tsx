import * as React from 'react'
import { FadeInOnScroll } from '../animation/FadeInOnScroll'
// @ts-ignore
// import Fade from 'react-reveal/Fade'
import { SvgAppHomeScreen } from '../svg/AppHomeScreen'
import { TextGradient } from '../text/TextGradient'

export function SharedBillValueProposition() {
    return (
        <FadeInOnScroll>
            <div className={'flex flex-row-break-reverse items-center justify-start md:justify-center'}>
                {/*<Fade bottom distance={'20px'}>*/}
                <div className={'flex-grow flex items-center justify-center w-full h-full'}>
                    <SvgAppHomeScreen />
                </div>
                {/*</Fade>*/}
                {/*<Fade bottom distance={'20px'}>*/}
                <div className={'flex-grow flex flex-col items-center justify-center w-full h-full m-8'}>
                    <div className={`flex flex-col`}>
                        <span
                            className={
                                'text-primary text-2xl md:text-3xl text-left mx-6 sm:mx-2 font-bold mb-2 md:mb-4 leading-8 pt-2 pb-2'
                            }
                            style={{ maxWidth: '600px' }}
                        >
                            Sharing bills has never been this easy
                        </span>
                        <span
                            className={'md:leading-relaxed text-secondary text-md md:text-xl text-left mx-6 sm:mx-2'}
                            style={{ maxWidth: '600px' }}
                        >
                            If you split recurring bills using Venmo or Zelle, you're wasting precious time & energy.{' '}
                            <br />
                            <br />
                            Using Equater you select a merchant, tell us who you split it with, and then
                            <TextGradient>&nbsp;we settle up automatically when you're billed.</TextGradient>
                        </span>
                    </div>
                </div>
                {/*</Fade>*/}
            </div>
        </FadeInOnScroll>
    )
}
