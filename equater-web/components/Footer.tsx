import Link from 'next/link'
import Router from 'next/router'
import * as React from 'react'
import { CSSProperties } from 'react'
import { SvgLogoFullUppercase } from './svg/LogoFullUppercase'

interface Props {
    style?: CSSProperties
}

export function Footer(props: Props) {
    return (
        <div
            className={'bg-app-primary flex flex-col justify-center items-center border-t-1 border-app-secondary p-8'}
            style={{ minHeight: '100px', ...props.style }}
        >
            <div
                className={'flex flex-col md:flex-row justify-start md:justify-between h-full w-full'}
                style={{ maxWidth: '1200px', ...props.style }}
            >
                <div className={'flex flex-row items-center justify-center'}>
                    <SvgLogoFullUppercase width={180} height={50} onClick={() => Router.push('/')} />
                </div>

                <div className={'flex flex-col md:flex-row items-center justify-start md:justify-center'}>
                    {/*Todo Replace with real links*/}
                    <a
                        className={'text-secondary plain-link pr-0 md:pr-4'}
                        href={'https://twitter.com/equater_app'}
                        target={'__blank'}
                        rel={'noreferrer'}
                    >
                        Twitter
                    </a>
                    <span className={'text-secondary pr-4 hidden md:block'}>·</span>
                    <Link href={'/privacy'}>
                        <a className={'text-secondary plain-link pr-0 md:pr-4'}>Privacy</a>
                    </Link>
                    <span className={'text-secondary pr-4 hidden md:block'}>·</span>
                    <Link href={'/terms'}>
                        <a className={'text-secondary plain-link pr-0 md:pr-4'}>Terms of Service</a>
                    </Link>
                </div>
            </div>
        </div>
    )
}
