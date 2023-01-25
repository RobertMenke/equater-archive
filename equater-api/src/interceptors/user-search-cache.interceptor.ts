import { CacheInterceptor, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { User } from '../user/user.entity'

// Note interceptors are executed after guards and this must always be called on authenticated routes
// Any module this is used in must register the CacheModule (it is not global)
@Injectable()
export class UserSearchCacheInterceptor extends CacheInterceptor {
    private readonly logger = new Logger(UserSearchCacheInterceptor.name)

    trackBy(context: ExecutionContext): string | undefined {
        const request = context.switchToHttp().getRequest()
        const searchTerm = request.query.searchTerm
        const user: User = request.user

        if (!(user instanceof User)) {
            throw new HttpException(`Unauthenticated request`, HttpStatus.UNAUTHORIZED)
        }

        this.logger.verbose(`Search Term: ${searchTerm}, User: ${user.email}`)

        return `${searchTerm}-${user.id}-${UserSearchCacheInterceptor.name}`
    }
}
