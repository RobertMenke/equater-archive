import { CacheModuleOptions, CacheOptionsFactory, Injectable } from '@nestjs/common'
import { parse } from 'url'
import { ConfigService } from './config.service'
import * as redisStore from 'cache-manager-redis-store'

@Injectable()
export class CacheModuleOptionsFactory implements CacheOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions {
        const redisUrl = this.configService.getRedisUrl()
        const redis_uri = parse(redisUrl)
        const isTlsConnection = redisUrl.includes('rediss')
        const redisPassword = redis_uri.auth.split(':')[1]
        // This tls config is specific to the underlying redis adapter, ioredis
        const tlsConfig = {
            tls: {
                rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }
        }

        return {
            store: redisStore,
            url: this.configService.getRedisUrl(),
            host: redis_uri.hostname,
            port: Number(redis_uri.port),
            password: redisPassword.trim().length > 0 ? redisPassword : undefined,
            ...(isTlsConnection ? tlsConfig : null)
        }
    }
}
