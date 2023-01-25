import Router from 'next/router'
import { useState } from 'react'
import * as React from 'react'
import { NextPage } from 'next'
import { SignIn } from '../../components/tailwind-ui/forms/SignIn'
import { signIn } from '../../services/auth-service'
import { BaseProps } from '../../types/BaseProps'

const SignInPage: NextPage<BaseProps> = (props) => {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    return (
        <SignIn
            error={error}
            setError={setError}
            isLoading={isLoading}
            onLoginAttempt={async (email: string, password: string) => {
                setIsLoading(true)
                try {
                    const { data, status } = await signIn(email, password)
                    if (status !== 201) {
                        setError('Invalid username or password')
                        return
                    }

                    if (data.redirectTo) {
                        await Router.push(data.redirectTo)
                    } else {
                        await Router.push('/dashboard')
                    }

                    return
                } catch (e) {
                    const err = e as Error
                    console.error(err.message)
                    setError('Invalid username or password')
                }

                setIsLoading(false)
            }}
        />
    )
}

export default SignInPage
