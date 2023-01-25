import { INestApplication } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { RedisAdapter } from '@socket.io/redis-adapter'

export class RedisIoAdapter extends IoAdapter {
    constructor(private readonly app: INestApplication, private readonly redisAdapter: (nsp: any) => RedisAdapter) {
        super(app)
    }

    createIOServer(port: number, options?: any): any {
        const server = super.createIOServer(port, options)
        server.adapter(this.redisAdapter)
        return server
    }
}
