import Link from 'next/link'
import Router from 'next/router'
import * as React from 'react'
import { CSSProperties, useEffect, useState } from 'react'
import { SvgLogoFullUppercase } from './svg/LogoFullUppercase'
import { SvgMenu } from './svg/SvgMenu'

interface Props {
    style?: CSSProperties
}

export function Header(props: Props) {
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [shouldHideMobileMenuIcon, setShouldHideMobileMenuIcon] = useState(false)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        setShouldHideMobileMenuIcon(urlParams.get('hideMobileMenu') === 'true')
    }, [])

    return (
        <>
            <div
                className={`fixed w-full flex flex-row items-center justify-center header-container ${
                    showMobileMenu ? 'bg-black' : ''
                }  header-blur`}
                style={{ minHeight: '60px' }}
            >
                <div
                    className={`flex flex-row items-center justify-between border-app-secondary self-center w-full pl-4 pr-4 header-container`}
                    style={{ maxWidth: '1200px', ...props.style }}
                >
                    <div className={'flex flex-row items-center justify-center cursor-pointer'}>
                        <SvgLogoFullUppercase
                            width={125}
                            height={30}
                            onClick={() => {
                                if (!shouldHideMobileMenuIcon) {
                                    Router.push('/')
                                }
                            }}
                        />
                    </div>

                    <div className={'hidden md:flex flex-col md:flex-row items-center justify-start md:justify-center'}>
                        <Link href={'https://discord.gg/k5EbjVWC'}>
                            <a
                                className={'text-secondary plain-link pr-0 md:pr-8'}
                                target={'__blank'}
                                rel={'noreferrer'}
                            >
                                Discord
                            </a>
                        </Link>
                        <Link href={'https://www.instagram.com/equater.app'}>
                            <a
                                className={'text-secondary plain-link pr-0 md:pr-8'}
                                target={'__blank'}
                                rel={'noreferrer'}
                            >
                                Instagram
                            </a>
                        </Link>
                        <a
                            className={'text-secondary plain-link pr-0 md:pr-8'}
                            href={'https://twitter.com/equater_app'}
                            target={'__blank'}
                            rel={'noreferrer'}
                        >
                            Twitter
                        </a>
                    </div>
                    {!shouldHideMobileMenuIcon && (
                        <SvgMenu
                            className={'flex md:hidden cursor-pointer'}
                            width={40}
                            height={40}
                            onClick={() => {
                                setShowMobileMenu(!showMobileMenu)
                            }}
                        />
                    )}
                </div>
            </div>
            <div style={{ minHeight: '60px' }} />

            <div
                className={`fixed flex flex-col w-full header-container md:hidden ${
                    showMobileMenu ? 'bg-black' : 'hidden'
                }`}
                style={{ top: '60px' }}
            >
                <div
                    className={'flex flex-row pt-4 pb-4 pl-16 text-secondary cursor-pointer hover:bg-app-secondary'}
                    onClick={() => {
                        window.open('https://discord.gg/k5EbjVWC')
                    }}
                >
                    Discord
                </div>

                <div
                    className={'flex flex-row pt-4 pb-4 pl-16 text-secondary cursor-pointer hover:bg-app-secondary'}
                    onClick={() => {
                        window.open('https://www.instagram.com/equater.app')
                    }}
                >
                    Instagram
                </div>

                <div
                    className={'flex flex-row pt-4 pb-4 pl-16 text-secondary cursor-pointer hover:bg-app-secondary'}
                    onClick={() => {
                        window.open('https://twitter.com/equater_app')
                    }}
                >
                    Twitter
                </div>
            </div>
        </>
    )
}
