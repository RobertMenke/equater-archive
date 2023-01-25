import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { logError } from '../utils/data.utils'

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ErrorLoggingInterceptor.name)

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err: HttpException | Error) => {
                // Not guaranteed that err will be an instanceof HttpException, but conventionally
                // any exception that gets thrown by the API will be
                if (err instanceof HttpException) {
                    const url = context.switchToHttp().getRequest().originalUrl
                    const response = err.getResponse()
                    const message = typeof response === 'object' ? JSON.stringify(response) : response
                    this.logger.error(`Error ${err.getStatus()} - ${url} ${message} ${err.stack}`)
                } else {
                    logError(this.logger, err)
                }

                throw err
            })
        )
    }
}
