import { useEffect, useRef, useState } from 'react'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    options?: IntersectionObserverInit
}

export function FadeInOnScroll(props: Props) {
    const domRef = useRef<HTMLDivElement>(null)
    const [isVisible, setVisible] = useState(false)

    useEffect(() => {
        const current = domRef.current
        if (!current) return

        const options = {
            threshold: 0.1,
            ...props.options
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.length === 0) return
            // Just 1 element to observe in this case (the section element below)
            if (entries[0].isIntersecting) {
                // Not possible to set it back to false like this:
                setVisible(true)
                // No need to keep observing:
                observer.unobserve(current)
            }
        }, options)

        observer.observe(current)

        return () => observer.unobserve(current)
    }, [domRef.current])

    return (
        <section ref={domRef} className={isVisible ? 'fade-in-section is-visible' : 'fade-in-section'}>
            {props.children}
        </section>
    )
}
