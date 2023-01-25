import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { User } from '../../user/user.entity'

@Injectable()
export class EmailConfirmationGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()
        const user: User = request.user

        if (!user) {
            throw new HttpException('Please sign in to continue', HttpStatus.UNAUTHORIZED)
        }

        if (!user.emailIsConfirmed) {
            throw new HttpException('email-confirmation-required', HttpStatus.FORBIDDEN)
        }

        return true
    }
}
