import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Role, User } from '../../user/user.entity'

@Injectable()
export class AdminOrSelfGuard implements CanActivate {
    constructor(private readonly userIdParamName: string) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()
        const user: User = request.user
        const userId = parseInt(request.params[this.userIdParamName])

        return user && (user.id === userId || user.role == Role.ADMIN)
    }
}
