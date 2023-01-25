import * as React from 'react'
import { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'
import { ProfileIcon } from '../icons/shape-so/profile-icon'
import { Button, ButtonRole } from '../tailwind-ui/input/button'
import axios from 'axios'

interface Props {
    className?: string
}

export function JoinTheWaitingList(props: Props) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function submitEmail() {
        setIsLoading(true)
        let text = "Thanks! We'll be in touch!"
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/newsletter/email`, {
                email
            })
        } catch (e) {
            console.error(e)
            text = 'Please enter a valid email address'
        }

        setIsLoading(false)
        toast(text)
    }

    return (
        <div className={`flex flex-col items-center justify-center mt-4 w-full ${props.className || ''}`}>
            <EmailInput
                value={email}
                setValue={setEmail}
                onEnter={() => {
                    submitEmail().catch(console.error)
                }}
            />
            <Button
                className={'pt-4'}
                onClick={() => {
                    submitEmail().catch(console.error)
                }}
                text={'Request Access'}
                isLoading={isLoading}
                role={ButtonRole.PRIMARY}
                style={{ width: '300px', height: '50px' }}
            />
        </div>
    )
}

interface EmailInputProps {
    value: string
    setValue: (value: string) => void
    onEnter: () => void | Promise<void>
}

function EmailInput(props: EmailInputProps) {
    return (
        <div
            className={`theme-dark bg-app-primary flex flex-row justify-start items-center border border-app-secondary rounded`}
            style={{
                width: '300px'
            }}
        >
            <div className={'p-4'}>
                <ProfileIcon />
            </div>
            <input
                type={'text'}
                className={`theme-dark bg-app-primary flex-grow text-gray-500 pt-4 pb-4 pl-2 pr-1 mr-1 font-md placeholder-gray-500 border-transparent`}
                placeholder={'Enter your email'}
                onChange={(event: FormEvent<HTMLInputElement>) => {
                    props.setValue(event.currentTarget.value)
                }}
                onKeyPress={(e) => {
                    if (e.key.toLowerCase() === 'enter') {
                        props.onEnter()
                    }
                }}
                value={props.value}
            />
        </div>
    )
}
