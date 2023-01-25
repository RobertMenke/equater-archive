import axios from 'axios'
import { signOut } from './auth-service'

// TODO: Implement a more secure token storage policy
// TODO: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
// TODO: https://blog.logrocket.com/jwt-authentication-best-practices/
export const JWT_AUTH_KEY_NAME = `tmp/EQUATER_JWT`

export function setAxiosMiddleware(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response.status === 401) {
                await signOut()
            }

            return Promise.reject(error)
        }
    )
}
