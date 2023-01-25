import { LogLevel } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { ConfigService, Environment } from './config/config.service'
import { createRedisAdapter } from './config/redis.factory'
import { ErrorLoggingInterceptor } from './interceptors/error-logging.interceptor'
import { PerformanceLoggingInterceptor } from './interceptors/performance-logging.interceptor'
import { RedisIoAdapter } from './socket/redis-io.adapter'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: getLogLevels()
    })
    const configService = app.get<ConfigService>(ConfigService)

    if (configService.get(Environment.NODE_ENV) === 'development') {
        app.enableCors({
            origin: '*'
        })
    } else {
        app.enableCors({
            origin: /equater\.app$/
        })
    }

    const redisAdapter = await createRedisAdapter(configService)
    app.useWebSocketAdapter(new RedisIoAdapter(app, redisAdapter))
    app.useGlobalInterceptors(new PerformanceLoggingInterceptor(), new ErrorLoggingInterceptor())
    await app.listen(process.env.PORT, '0.0.0.0')
}

function getLogLevels(): LogLevel[] {
    if (process.env.NODE_ENV === 'production') {
        return ['log', 'error', 'warn']
    }

    return ['log', 'error', 'warn', 'debug', 'verbose']
}

bootstrap().catch((e) => {
    console.error(e)
    throw e
})
