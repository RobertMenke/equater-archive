import { useEffect, useState } from 'react'
import * as React from 'react'
import { SvgArrowDownBlend } from '../icons/hero-icons/ArrowDownBlend'
import { LottieView } from '../lottie/LottieView'
import { TextGradient } from '../text/TextGradient'
import { DownloadApps } from './DownloadApps'
import levitatingFinanceMan from '../../public/static/lottie/levitating-finances.json'

export function WelcomeToEquater() {
    const [showTitle, setShowTitle] = useState(false)
    const [showSubTitle, setShowSubTitle] = useState(false)
    const [showSignUp, setShowSignUp] = useState(false)
    const [showArrow, setShowArrow] = useState(false)
    const [lottieScale, setLottieScale] = useState('scale-90')

    useEffect(() => {
        setTimeout(() => setShowTitle(true), 50)
        setTimeout(() => setShowSubTitle(true), 200)
        setTimeout(() => setShowSignUp(true), 350)
        setTimeout(() => setShowArrow(true), 500)
        setLottieScale('scale-100')
    }, [])

    return (
        <div className={'flex flex-col items-center justify-center pt-4'}>
            <LottieView
                animationData={levitatingFinanceMan}
                className={`lottie min-h-[300px] md:min-h-[434px] md:min-w-[500px] transition-transform duration-1000 ${lottieScale}`}
            />
            <div className={'flex flex-col items-center justify-center lottie-text-adjustment'}>
                <span
                    className={`text-primary text-center text-4xl leading-tight font-bold leading-8 pt-2 pb-2 px-6 sm:px-4 ${
                        showTitle ? 'fade-in opacity-100' : 'opacity-0'
                    }`}
                >
                    Split recurring bills <TextGradient>automatically</TextGradient>
                </span>
                <span
                    className={`text-secondary text-left sm:text-center text-base md:text-xl md:leading-relaxed leading-6 px-6 sm:px-4 ${
                        showSubTitle ? 'fade-in opacity-100' : 'opacity-0'
                    }`}
                    style={{ maxWidth: '600px' }}
                >
                    Equater is built for shared monthly expenses. Tell us how you split your expenses and we'll settle
                    up for you.
                </span>
                <DownloadApps className={`${showSignUp ? 'fade-in opacity-100' : 'opacity-0'}`} />
            </div>
            <div
                className={`relative flex flex-col items-center justify-center mt-8 learn-more ${
                    showArrow ? 'fade-in opacity-100' : 'opacity-0'
                }`}
            >
                <span className={'text-primary'}>Learn More</span>
                <SvgArrowDownBlend className={'relative animate-up-down'} />
            </div>
        </div>
    )
}
