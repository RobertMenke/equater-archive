import axios, { AxiosResponse } from 'axios'
import Router from 'next/router'
import { User } from '../redux/slices/auth.slice'

export interface SignInResponse {
    authToken: string
    user: User
    redirectTo?: string
}

export const passwordIsValid = (password: string) => password.trim().length >= 12

export function submitPasswordUpdate(password: string, resetToken: string): Promise<AxiosResponse<void>> {
    return axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/password-reset`, {
        uuid: resetToken,
        password: password
    })
}

export function signIn(email: string, password: string): Promise<AxiosResponse<SignInResponse>> {
    return axios.post(`/api/admin/sign-in`, {
        email,
        password
    })
}

export function requestPasswordReset(email: string): Promise<AxiosResponse> {
    return axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/request-password-reset`, {
        email
    })
}

export async function signOut() {
    await axios.post('/api/sign-out')

    if (typeof window !== typeof undefined) {
        window.location.reload()
    } else {
        await Router.push('/sign-in')
    }
}
