import { CacheInterceptor, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { User } from '../user/user.entity'

// Note interceptors are executed after guards and this must always be called on authenticated routes
// Any module this is used in must register the CacheModule (it is not global)
@Injectable()
export class VendorSearchCacheInterceptor extends CacheInterceptor {
    private readonly logger = new Logger(VendorSearchCacheInterceptor.name)

    trackBy(context: ExecutionContext): string | undefined {
        const request = context.switchToHttp().getRequest()
        const searchTerm = request.query.searchTerm
        const reviewFlag = request.query.requiringInternalReview
        const user: User = request.user

        if (!(user instanceof User)) {
            throw new HttpException(`Unauthenticated request`, HttpStatus.UNAUTHORIZED)
        }

        this.logger.verbose(`Search Term: ${searchTerm}, User: ${user.email}`)

        return `${searchTerm}-${reviewFlag}-${user.id}-${VendorSearchCacheInterceptor.name}`
    }
}
