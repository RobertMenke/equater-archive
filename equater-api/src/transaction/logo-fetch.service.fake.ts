import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { createReadStream } from 'fs'
import { Observable, of } from 'rxjs'
import * as stream from 'stream'
import { ConfigService } from '../config/config.service'
import { SAMPLE_BRAND_ASSETS_DIRECTORY, SAMPLE_VENDOR_ICON } from '../seeding/seeding.constants'

@Injectable()
export class LogoFetchServiceFake {
    static SHOULD_FAIL = false

    constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {}

    findLogoForCompanyName(name: string): Observable<stream.Readable> {
        if (LogoFetchServiceFake.SHOULD_FAIL) {
            throw new Error('Failed to fetch logo')
        }

        const readStream = createReadStream(`${SAMPLE_BRAND_ASSETS_DIRECTORY}/${SAMPLE_VENDOR_ICON}`)

        return of(readStream)
    }
}
