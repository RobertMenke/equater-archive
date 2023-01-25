import { Logger } from '@nestjs/common'
import { createAdapter, RedisAdapter } from '@socket.io/redis-adapter'
import { ConfigService } from './config.service'
import { createClient, RedisClientOptions } from 'redis'

// NB: Heroku Redis will disconnect idle connections every 5 mins. This is normal and should not be
// considered an error scenario.
export async function createRedisAdapter(configService: ConfigService): Promise<(nsp: any) => RedisAdapter> {
    const pubClient = createClient(createRedisClientOptions(configService))
    pubClient.on('error', (err) => {
        Logger.verbose(`REDIS error (pub client) ${err.message}`)
    })
    pubClient.on('connect', () => Logger.verbose('REDIS pubClient is connecting'))
    pubClient.on('reconnecting', () => Logger.verbose('REDIS pubClient is reconnecting'))
    pubClient.on('ready', () => Logger.verbose('REDIS pubClient is ready'))

    const subClient = pubClient.duplicate()
    subClient.on('error', (err) => {
        Logger.error(`REDIS error (sub client) ${err.message}`)
    })
    subClient.on('connect', () => Logger.verbose('REDIS subClient is connecting'))
    subClient.on('reconnecting', () => Logger.verbose('REDIS subClient is reconnecting'))
    subClient.on('ready', () => Logger.verbose('REDIS subClient is ready'))

    await Promise.all([pubClient.connect(), subClient.connect()])

    return createAdapter(pubClient, subClient)
}

export function createRedisClientOptions(configService: ConfigService): RedisClientOptions {
    const redisUrl = configService.getRedisUrl()
    const isTlsConnection = redisUrl.includes('rediss')
    // This tls config is specific to the underlying redis adapter, redis
    const tlsConfig = {
        socket: {
            tls: true,
            rejectUnauthorized: false
        }
    }

    return {
        url: redisUrl,
        ...(isTlsConnection ? tlsConfig : null)
    }
}
