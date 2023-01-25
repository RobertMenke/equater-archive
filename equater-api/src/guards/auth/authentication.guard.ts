import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from '../../user/auth.service'
import { User } from '../../user/user.entity'
import { UserAccount } from '../../user_account/user-account.entity'

@Injectable()
export class AuthenticationGuard implements CanActivate {
    private readonly logger = new Logger(AuthenticationGuard.name)

    constructor(private readonly authService: AuthService) {}

    /**
     * Attach the userProfile to the request like Nest expects for an out of the box
     * authe service
     *
     * @param context
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest<Request>()
            request.user = await this.authService.findAuthenticatedUser(request)

            return true
        } catch (err) {
            this.logger.log(err.message)
            return false
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: User
}

export interface AuthenticatedAccountRequest extends AuthenticatedRequest {
    account: UserAccount
}
