import { SharedBullConfigurationFactory } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import * as Bull from 'bull'
import { parse } from 'url'
import { ConfigService, Environment } from './config.service'

@Injectable()
export class BullModuleOptionsFactory implements SharedBullConfigurationFactory {
    constructor(private readonly configService: ConfigService) {}

    createSharedConfiguration(): Promise<Bull.QueueOptions> | Bull.QueueOptions {
        const redisUrl = this.configService.getRedisUrl()
        const redis_uri = parse(redisUrl)
        const isTlsConnection = redisUrl.includes('rediss')
        const redisPassword = redis_uri.auth.split(':')[1]
        // This tls config is specific to the underlying redis adapater, ioredis
        const tlsConfig = {
            tls: {
                rejectUnauthorized: false
            }
        }

        return {
            redis: {
                host: redis_uri.hostname,
                port: Number(redis_uri.port),
                password: redisPassword.trim().length > 0 ? redisPassword : undefined,
                ...(isTlsConnection ? tlsConfig : null)
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                delay: +this.configService.get(Environment.RECURRENT_PAYMENT_QUEUE_DELAY_MILLIS),
                attempts: 5
            }
        }
    }
}
