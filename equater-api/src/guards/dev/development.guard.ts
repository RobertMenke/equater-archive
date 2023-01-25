import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { configService } from '../../config/config.service'
import { User } from '../../user/user.entity'

@Injectable()
export class DevelopmentGuard implements CanActivate {
    //TODO: Create a proper role system
    private readonly developers = ['robert.b.menke@gmail.com']

    canActivate(context: ExecutionContext): boolean {
        const user: User = context.switchToHttp().getRequest().user

        if (!user) {
            return false
        }

        return configService.isDevelopment() || this.developers.indexOf(user.email) >= 0
    }
}
