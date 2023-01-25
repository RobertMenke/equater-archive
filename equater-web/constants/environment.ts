import { IronSessionOptions } from 'iron-session'
import { JWT_AUTH_KEY_NAME } from '../services/http'

export const SERVER_SECRET_COOKIE_PASSWORD = process.env.SECRET_COOKIE_PASSWORD
export const SERVER_API_DOMAIN = process.env.NEXT_PUBLIC_API_HOST

export const sessionOptions: IronSessionOptions = {
    cookieName: JWT_AUTH_KEY_NAME,
    password: SERVER_SECRET_COOKIE_PASSWORD || ''
}

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
    interface IronSessionData {
        authToken: string
        attemptedUrlBeforeSignIn?: string
    }
}
