import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { User } from '../../user/user.entity'

@Injectable()
export class UserIdGuard implements CanActivate {
    private readonly userIdParamName: string
    private readonly forbiddenMessage: string

    constructor(userIdParamName: string, forbiddenMessage: string = null) {
        this.userIdParamName = userIdParamName
        this.forbiddenMessage = forbiddenMessage
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>()
        // @ts-ignore
        const user: User = request.user

        if (!user) {
            throw new HttpException(
                'UserIdGuard invoked prior to AuthenticationGuard',
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const userId = parseInt(request.params[this.userIdParamName])

        if (user.id !== userId) {
            const message = this.forbiddenMessage || 'You do not have access to this content'
            throw new HttpException(message, HttpStatus.FORBIDDEN)
        }

        return true
    }
}
