import Link from 'next/link'
import { useState } from 'react'
import * as React from 'react'
import { NextPage } from 'next'
import { toast } from 'react-toastify'
import AppSnackbar from '../../components/feedback/Snackbar'
import { ArrowLeft } from '../../components/icons/hero-icons/arrow-left'
import { SvgLogoFullUppercase } from '../../components/svg/LogoFullUppercase'
import { Button, ButtonRole } from '../../components/tailwind-ui/input/button'
import { requestPasswordReset } from '../../services/auth-service'
import { BaseProps } from '../../types/BaseProps'

const RequestPasswordReset: NextPage<BaseProps> = (props) => {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')

    async function submit() {
        if (!isLoading) {
            setIsLoading(true)
            try {
                const { data, status } = await requestPasswordReset(email)
                // Always show a success message to prevent malicious users from finding out who has an equater email
                toast('We sent you a link!')
            } catch (e) {
                //@ts-ignore
                console.error(e.message)
                setError('Invalid email')
            }

            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="theme-dark min-h-screen bg-app-primary flex">
                <div className="flex-1 flex flex-col justify-center py-12 px-4">
                    <div className="mx-auto w-full max-w-sm">
                        <div>
                            <div className={'flex flex-start'}>
                                <Link href={'/sign-in'}>
                                    <div
                                        className={'bg-transparent hover:bg-app-secondary rounded-full cursor-pointer'}
                                    >
                                        <ArrowLeft className={'text-primary text-2xl w-16 h-16 p-4'} />
                                    </div>
                                </Link>
                            </div>
                            <SvgLogoFullUppercase />
                            <h2 className="mt-6 text-3xl leading-9 font-extrabold text-primary">
                                Request a password reset
                            </h2>
                        </div>
                        {error && (
                            <div className={'mt-4'}>
                                <span className={'text-red-500'}>{error}</span>
                            </div>
                        )}

                        <div className="mt-8">
                            <div className="mt-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium leading-5 text-secondary"
                                    >
                                        Email address
                                    </label>
                                    <div className="mt-1 rounded-md shadow-sm">
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus={true}
                                            className="appearance-none block w-full bg-app-secondary text-primary px-3 py-2 border-transparent rounded-md placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(event.currentTarget.value)
                                                setError(null)
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
                                    <Button
                                        onClick={submit}
                                        text={'Submit'}
                                        isLoading={isLoading}
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
            <AppSnackbar />
        </>
    )
}

export default RequestPasswordReset
