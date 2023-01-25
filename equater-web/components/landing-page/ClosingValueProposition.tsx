import * as React from 'react'
import { DownloadApps } from './DownloadApps'

export function ClosingValueProposition() {
    return (
        <div className={'flex flex-col items-center justify-center h-full'}>
            <span
                className={
                    'text-primary text-2xl md:text-3xl text-left sm:text-center mx-6 sm:mx-2 font-bold mb-2 md:mb-4 leading-8 pt-2 pb-2'
                }
            >
                Stay up to date with our latest developments
            </span>
            <span
                className={
                    'text-secondary text-base md:text-xl md:leading-relaxed text-left sm:text-center mb-2 mx-6 sm:mx-2'
                }
                style={{ maxWidth: '700px' }}
            >
                We’re currently beta testing our software with a small group of users. We’d love to stay in touch and
                send you an email when we’re live.
            </span>

            <DownloadApps />
        </div>
    )
}
