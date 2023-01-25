import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Role, User } from '../../user/user.entity'
import { UserAccountService } from '../../user_account/user-account.service'

@Injectable()
export class AccountUpdateGuard implements CanActivate {
    constructor(private readonly accountService: UserAccountService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const user: User = request.user
        const accountId = request.params['accountId'] || request.body.accountId

        if (!user || !accountId) {
            return false
        }

        const account = await this.accountService.findOneWhere({
            userId: user.id,
            id: accountId
        })

        request.account = account

        if (user.role === Role.ADMIN) {
            return true
        }

        return Boolean(account)
    }
}
