import * as React from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { passwordIsValid, submitPasswordUpdate } from '../../services/auth-service'
import { BaseProps } from '../../types/BaseProps'
import { PasswordInput } from '../input/PasswordInput'
import { FullPageRespectingLayout } from '../layout/full-page-respecting-layout'
import { Button, ButtonRole } from '../tailwind-ui/input/button'
import SubTitle from '../text/SubTitle'
import Title from '../text/Title'

interface Props extends BaseProps {
    title: string
    subTitle: string
    resetToken: string
}

interface PasswordResetState {
    password: string
    loading: boolean
    disabled: boolean
    error: string
}

export function PasswordReset(props: Props) {
    const [state, setState] = useState<PasswordResetState>({
        password: '',
        loading: false,
        disabled: true,
        error: ''
    })

    async function submit() {
        setState({
            ...state,
            loading: true,
            disabled: true
        })

        try {
            await submitPasswordUpdate(state.password, props.resetToken)
            setState({
                ...state,
                loading: false,
                disabled: false
            })
            toast('Password updated successfully!')
        } catch (e) {
            setState({
                ...state,
                loading: false,
                disabled: false,
                error: 'Invalid or expired password reset token'
            })
        }
    }

    return (
        <FullPageRespectingLayout>
            <div className={'flex flex-col items-center justify-center h-full m-8'}>
                <Title text={props.title} />
                <SubTitle text={props.subTitle} className={'pb-4 pt-2'} />
                {state.error.length > 0 && (
                    <span
                        className={`text-red-400 md:text-xl text-center pb-4 ${props.className ? props.className : ''}`}
                        style={{ maxWidth: '700px', marginTop: '-4px' }}
                    >
                        {state.error}
                    </span>
                )}
                <PasswordInput
                    value={state.password}
                    setValue={(value) => {
                        setState({
                            ...state,
                            error: '',
                            disabled: !passwordIsValid(value),
                            password: value
                        })
                    }}
                    onEnter={() => {
                        if (!state.disabled) {
                            submit().catch(console.error)
                        }
                    }}
                    placeholder={'Enter a new password'}
                    className={'mb-4'}
                />
                <Button
                    onClick={() => {
                        if (!state.disabled) {
                            submit().catch(console.error)
                        }
                    }}
                    text={'Submit'}
                    isLoading={state.loading}
                    disabled={state.disabled}
                    role={ButtonRole.PRIMARY}
                    style={{ width: '300px', height: '50px' }}
                />
            </div>
        </FullPageRespectingLayout>
    )
}

export default PasswordReset
