import axios, { AxiosError } from 'axios'
import { withIronSessionApiRoute } from 'iron-session/next'
import { SERVER_API_DOMAIN, sessionOptions } from '../../../constants/environment'
import { SignInResponse } from '../../../services/auth-service'

interface UserLoginRequestBody {
    email: string
    password: string
}

// https://github.com/vvo/iron-session#usage-nextjs
export default withIronSessionApiRoute(async (req, res) => {
    try {
        const body = req.body as UserLoginRequestBody
        const response = await axios.post<SignInResponse>(`${SERVER_API_DOMAIN}/api/auth/admin-login`, body)
        req.session.authToken = response.data.authToken
        await req.session.save()

        res.status(201)

        const data = req.session.attemptedUrlBeforeSignIn
            ? { ...response.data, redirectTo: req.session.attemptedUrlBeforeSignIn }
            : response.data

        res.json(data)
    } catch (e) {
        //@ts-ignore
        const err: AxiosError = e
        console.error(err.message)
        res.status(err.response?.status || 500).json(err.response?.data || {})
    }
}, sessionOptions)
