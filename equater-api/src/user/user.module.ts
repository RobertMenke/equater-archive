import { CacheModule, Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AwsModule } from '../aws/aws.module'
import { CacheModuleOptionsFactory } from '../config/cache-module-options.factory'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { DeviceModule } from '../device/device.module'
import { DwollaModule } from '../dwolla/dwolla.module'
import { EmailModule } from '../email/email.module'
import { AuthenticationGuard } from '../guards/auth/authentication.guard'
import { LoginLogModule } from '../login_log/login-log.module'
import { PlaidModule } from '../plaid/plaid.module'
import { Authorization } from '../security/transport/Authorization'
import { PlaidAuthenticationErrorHandler } from '../user_account/events/plaid-authentication-error.handler'
import { UserAccountModule } from '../user_account/user-account.module'
import { AuthService } from './auth.service'
import { AuthenticationController } from './authentication.controller'
import { DwollaIntegrationService } from './dwolla-integration.service'
import { DwollaDevelopmentController } from './dwolla.development.controller'
import { ConfirmRelationshipHandler } from './events/confirm-relationship.handler'
import { CreateRelationshipHandler } from './events/create-relationship.handler'
import { Relationship } from './relationship.entity'
import { RelationshipService } from './relationship.service'
import { UserInvite } from './user-invite.entity'
import { UserInviteService } from './user-invite.service'
import { UserController } from './user.controller'
import { User } from './user.entity'
import { UserService } from './user.service'

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserInvite, Relationship]),
        ConfigModule,
        LoginLogModule,
        EmailModule,
        UserAccountModule,
        DwollaModule,
        PlaidModule,
        DeviceModule,
        AwsModule,
        CqrsModule,
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useClass: CacheModuleOptionsFactory
        })
    ],
    controllers: [UserController, AuthenticationController, DwollaDevelopmentController],
    providers: [
        UserService,
        AuthenticationGuard,
        UserInviteService,
        DwollaIntegrationService,
        RelationshipService,
        CreateRelationshipHandler,
        ConfirmRelationshipHandler,
        PlaidAuthenticationErrorHandler,
        AuthService,
        {
            provide: Provider.AUTHORIZATION_SERVICE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Authorization(
                    configService.getKey(Environment.PUBLIC_KEY),
                    configService.getKey(Environment.PRIVATE_KEY)
                )
            }
        }
    ],
    exports: [UserService, UserInviteService, DwollaIntegrationService, AuthService, RelationshipService]
})
export class UserModule {}
