import { Module } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { ConfigModule } from '../config/config.module'
import { ConfigService, Environment, Provider } from '../config/config.service'
import { LOCALSTACK_S3_URL } from '../config/constants'
import { S3Service } from './s3.service'

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: Provider.S3_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                new S3({
                    region: configService.get(Environment.AWS_REGION),
                    accessKeyId: configService.get(Environment.S3_ACCESS_KEY),
                    secretAccessKey: configService.get(Environment.S3_SECRET_KEY),
                    signatureVersion: 'v4',
                    endpoint: configService.isTesting() ? LOCALSTACK_S3_URL : undefined,
                    s3ForcePathStyle: configService.isTesting()
                })
        },
        S3Service
    ],
    exports: [S3Service]
})
export class AwsModule {}
