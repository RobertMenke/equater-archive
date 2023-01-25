import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { differenceInMilliseconds, differenceInSeconds } from 'date-fns'

@Injectable()
export class PerformanceLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(PerformanceLoggingInterceptor.name)

    /**
     * Perf Thresholds:
     * - Normal: < 1 second
     * - Warning: 1 >= request < 3 seconds
     * - Error: >= 3 seconds
     *
     * @param context
     * @param next
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const before = Date.now()

        return next.handle().pipe(
            tap(() => {
                const after = Date.now()
                const url = context.switchToHttp().getRequest().originalUrl
                const diffInMillis = differenceInMilliseconds(after, before)
                const diffInSeconds = differenceInSeconds(after, before)
                if (diffInMillis < 1000) {
                    this.logger.verbose(`Perf -- ${url} -- ${diffInMillis} milliseconds`)
                } else if (diffInMillis < 3000) {
                    this.logger.warn(`Perf -- ${url} -- ${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`)
                } else {
                    this.logger.error(`Perf -- ${url} -- ${diffInSeconds} seconds`)
                }
            })
        )
    }
}
