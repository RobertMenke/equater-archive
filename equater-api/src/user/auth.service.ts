import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { Provider } from '../config/config.service'
import { Authorization } from '../security/transport/Authorization'
import { SessionTokenDto } from './user.dtos'
import { Role, User } from './user.entity'
import { UserService } from './user.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        @Inject(Provider.AUTHORIZATION_SERVICE) private readonly authorization: Authorization
    ) {}

    /**
     * Create the bearer token used to
     *
     * @param user
     */
    createBearerToken(user: User): string {
        const dto: SessionTokenDto = {
            userId: user.id,
            sessionId: uuid()
        }

        return this.authorization.createBearerToken(dto)
    }

    /**
     * We don't want admin sign-ins to invalidate normal app sessions because that would be annoying :)
     *
     * @param user
     */
    async createAdminBearerToken(user: User): Promise<string> {
        if (user.role !== Role.ADMIN) {
            throw new HttpException('Access Denied', HttpStatus.FORBIDDEN)
        }

        const storedDto = user.sessionToken ? this.authorization.extractData<SessionTokenDto>(user.sessionToken) : null
        const dto: SessionTokenDto = storedDto || {
            userId: user.id,
            sessionId: uuid()
        }

        await this.usersService.updateSessionToken(user, this.authorization.createBearerToken(dto))

        return this.authorization.createBearerToken(dto, {
            expiresIn: '8h'
        })
    }

    /**
     * Find a userProfile from an authorization header bearer token
     *
     * @param request
     * @return Promise<User>
     */
    async findAuthenticatedUser(request: Request): Promise<User> {
        const authHeader = request.headers.authorization

        if (!authHeader.startsWith('Bearer')) {
            throw new UnauthorizedException('Request without bearer token')
        }

        const token = authHeader.substring(7, authHeader.length)

        return await this.findUserFromAuthToken(token)
    }

    async findUserFromAuthToken(token: string): Promise<User> {
        const dto = this.authorization.extractData<SessionTokenDto>(token)
        const user = await this.usersService.findOneWhere({ id: dto.userId })

        if (!user) {
            throw new UnauthorizedException(`User not found matching id ${dto.userId}`)
        }

        if (user.sessionToken === null) {
            throw new UnauthorizedException(`User session is not valid for ${user.id}`)
        }

        const storedDto = this.authorization.extractData<SessionTokenDto>(user.sessionToken)

        if (storedDto.sessionId !== dto.sessionId) {
            await this.usersService.updateSessionToken(user, null)
            throw new UnauthorizedException(`Session tokens do not match for ${user.id}`)
        }

        return user
    }
}
