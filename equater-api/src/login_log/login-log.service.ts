import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Request } from 'express'
import { Repository } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { User } from '../user/user.entity'
import { LoginLog } from './login-log.entity'

@Injectable()
export class LoginLogService implements DeletesManagedResources {
    constructor(
        @InjectRepository(LoginLog)
        private readonly repository: Repository<LoginLog>
    ) {}

    async deleteManagedResourcesForUser(user: User): Promise<void> {
        await this.repository.delete({
            userId: user.id
        })
    }

    log(request: Request, user: User): Promise<LoginLog> {
        return this.repository.save(
            new LoginLog({
                userId: user.id,
                ipAddress: request.connection.remoteAddress,
                userAgent: request.headers['user-agent'],
                dateTimeAuthenticated: new Date(Date.now())
            })
        )
    }

    find(user: User): Promise<LoginLog[]> {
        return this.repository.find({
            where: {
                userId: user.id
            }
        })
    }
}
