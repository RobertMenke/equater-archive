import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

export enum ServerEnvironment {
    DEVELOPMENT = 'DEVELOPMENT',
    STAGING = 'STAGING'
}

@Injectable()
export class EnvironmentGuard implements CanActivate {
    constructor(private readonly supportedEnvironments: string[]) {}

    canActivate(_: ExecutionContext): boolean {
        return this.supportedEnvironments.includes(process.env.SERVER_ENVIRONMENT?.toUpperCase())
    }
}
