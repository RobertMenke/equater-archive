import { useEffect, useRef } from 'react'
import * as React from 'react'
import lottie from 'lottie-web'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    // Unfortunately, this is how lottie's API is defined.
    animationData: any
}

export function LottieView(props: Props) {
    const ref = useRef<HTMLElement>(null)
    useEffect(() => {
        if (ref.current) {
            lottie.loadAnimation({
                name: props.animationData,
                container: ref.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: props.animationData
            })
        }

        return () => {
            lottie.destroy(props.animationData)
        }
    }, [ref])

    // @ts-ignore
    return <div className={`lottie ${props.className ? props.className : ''}`} ref={ref} />
}
