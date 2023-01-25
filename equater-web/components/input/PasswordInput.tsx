import * as React from 'react'
import { FormEvent } from 'react'
import { BaseProps } from '../../types/BaseProps'
import { SvgLockFlow } from '../icons/hero-icons/LockFlow'

interface PasswordInputProps extends BaseProps {
    value: string
    setValue: (value: string) => void
    placeholder: string
    onEnter?: () => void
}

export function PasswordInput(props: PasswordInputProps) {
    return (
        <div
            className={`theme-dark bg-app-primary flex flex-row justify-start items-center border border-app-secondary rounded ${props.className || ''}`}
            style={{
                width: '300px'
            }}
        >
            <div className={'p-4'}>
                <SvgLockFlow />
            </div>
            <input
                type={'password'}
                className={`theme-dark bg-app-primary flex-grow text-gray-500 pt-4 pb-4 pl-2 pr-1 mr-1 font-md placeholder-gray-500 border-transparent`}
                placeholder={props.placeholder}
                onChange={(event: FormEvent<HTMLInputElement>) => {
                    props.setValue(event.currentTarget.value)
                }}
                value={props.value}
                onKeyPress={(event) => {
                    if (event.key.toLowerCase() === 'enter' && props.onEnter) {
                        props.onEnter()
                    }
                }}
            />
        </div>
    )
}
