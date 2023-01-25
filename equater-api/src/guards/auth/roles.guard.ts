import { CanActivate, ExecutionContext, Injectable, Logger, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role, User } from '../../user/user.entity'

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name)

    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const user: User = context.switchToHttp().getRequest().user
        const roles = this.reflector.get<string[]>('roles', context.getHandler())

        if (!roles) {
            return false
        }

        if (!user) {
            this.logger.error(`No user found in RolesGuard canActivate returning false`)
            return false
        }

        return this.matchRoles(user, roles)
    }

    private matchRoles(user: User, roles: string[]) {
        if (roles.indexOf(Role.ADMIN) >= 0) {
            return user.role === Role.ADMIN
        }

        return roles.indexOf(Role.USER) >= 0
    }
}

// This can only be applied at the route level (as opposed to the controller level)
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)
