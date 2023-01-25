import { Inject, Injectable, Logger } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { Readable } from 'stream'
import { Provider } from '../config/config.service'
import { HashAlgorithm, hashReadStream, logError } from '../utils/data.utils'

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name)
    constructor(@Inject(Provider.S3_CLIENT) private readonly s3Client: S3) {}

    createPreSignedUploadUrl(params: S3.PutObjectRequest): Promise<string> {
        return this.s3Client.getSignedUrlPromise('putObject', params)
    }

    createPreSignedDownloadUrl(params: S3.GetObjectRequest): Promise<string> {
        return this.s3Client.getSignedUrlPromise('getObject', params)
    }

    createWriteStream(destination: S3.PutObjectRequest): Promise<S3.ManagedUpload.SendData> {
        return this.s3Client.upload(destination).promise()
    }

    createReadStream(params: S3.GetObjectRequest): Readable {
        return this.s3Client
            .getObject(params)
            .createReadStream()
            .on('error', (err) => {
                logError(this.logger, err)
            })
    }

    hashFile(params: S3.GetObjectRequest): Promise<string> {
        const stream = this.createReadStream(params)

        return hashReadStream(stream, HashAlgorithm.SHA256)
    }

    getObject(params: S3.GetObjectRequest): Promise<S3.GetObjectOutput> {
        return this.s3Client.getObject(params).promise()
    }

    deleteObject(params: S3.DeleteObjectRequest): Promise<S3.DeleteObjectOutput> {
        return this.s3Client.deleteObject(params).promise()
    }

    uploadFile(params: S3.PutObjectRequest): Promise<S3.ManagedUpload.SendData> {
        return this.s3Client.upload(params).promise()
    }
}
