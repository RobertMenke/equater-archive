import Link from 'next/link'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useFocus } from '../../../hooks/useFocus'
import { BaseProps } from '../../../types/BaseProps'
import { SvgLogoFullUppercase } from '../../svg/LogoFullUppercase'
import { Button, ButtonRole } from '../input/button'

interface Props extends BaseProps {
    error: string | null
    isLoading: boolean
    onLoginAttempt: (email: string, password: string) => Promise<void>
    setError: (error: string | null) => void
}

export function SignIn(props: Props) {
    const [state, setState] = useState({
        email: '',
        password: ''
    })

    const [inputRef, setInputFocus] = useFocus<HTMLInputElement>()

    useEffect(() => {
        setInputFocus()
    }, [])

    async function submit() {
        if (!props.isLoading) {
            await props.onLoginAttempt(state.email, state.password)
        }
    }

    return (
        <div className="theme-dark min-h-screen bg-app-primary flex">
            <div className="flex-1 flex flex-col justify-center py-12 px-4">
                <div className="mx-auto w-full max-w-sm">
                    <div>
                        <SvgLogoFullUppercase />
                        <h2 className="mt-6 text-3xl leading-9 font-extrabold text-primary">Sign in to your account</h2>
                    </div>
                    {props.error && (
                        <div className={'mt-4'}>
                            <span className={'text-red-500'}>{props.error}</span>
                        </div>
                    )}

                    <div className="mt-8">
                        <div className="mt-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-5 text-secondary">
                                    Email address
                                </label>
                                <div className="mt-1 rounded-md shadow-sm">
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus={true}
                                        ref={inputRef}
                                        className="appearance-none block w-full bg-app-secondary text-primary px-3 py-2 border-transparent rounded-md placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                        value={state.email}
                                        onChange={(event) => {
                                            setState({
                                                ...state,
                                                email: event.currentTarget.value
                                            })
                                            props.setError(null)
                                        }}
                                        onKeyPress={async (event) => {
                                            if (event.key.toLowerCase() === 'enter') {
                                                await submit()
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium leading-5 text-secondary"
                                >
                                    Password
                                </label>
                                <div className="mt-1 rounded-md shadow-sm">
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="appearance-none block w-full bg-app-secondary text-primary px-3 py-2 border-transparent rounded-md placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                        value={state.password}
                                        onChange={(event) => {
                                            setState({
                                                ...state,
                                                password: event.currentTarget.value
                                            })
                                            props.setError(null)
                                        }}
                                        onKeyPress={async (event) => {
                                            if (event.key.toLowerCase() === 'enter') {
                                                await submit()
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm leading-5">
                                    <Link href={'/request-password-reset'}>
                                        <a className="font-medium text-accent-primary hover:text-accent-light focus:outline-none focus:underline transition ease-in-out duration-150">
                                            Forgot your password?
                                        </a>
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button
                                    onClick={submit}
                                    text={'Sign In'}
                                    isLoading={props.isLoading}
                                    role={ButtonRole.PRIMARY}
                                    className={'w-full'}
                                    style={{ width: '100%', height: '50px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
