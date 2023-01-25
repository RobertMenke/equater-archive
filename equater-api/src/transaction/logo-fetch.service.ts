import { HttpStatus, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { get } from 'fast-levenshtein'
import { Observable } from 'rxjs'
import { filter, map, switchMap } from 'rxjs/operators'
import * as stream from 'stream'
import { ConfigService, Environment } from '../config/config.service'

interface ClearbitCompanyResponse {
    name: string
    domain: string
    logo: string
}

interface BrandfetchResponse {
    response: {
        logo: null | {
            safe: boolean
            image: string | null //url
            svg: string | null //url
        }
        //possibly null
        icon: null | {
            image: string | null //url
            svg: string | null //url
        }
    }
    statusCode: number
}

@Injectable()
export class LogoFetchService {
    constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {}

    /**
     * Based on a company name, try to create a read stream for a particular logo
     *
     * @param name
     */
    findLogoForCompanyName(name: string): Observable<stream.Readable> {
        const details$ = this.fetchCompanyDetails(name)

        return details$.pipe(
            // Use the domain from the clearbit response to fetch a logo from brandfetch
            switchMap((response) => this.fetchBrandfetchLogo(response)),
            // Filter out a potentially null response from brandfetch
            filter((response) => Boolean(response) && response.statusCode === HttpStatus.OK),
            // Get the logo url, preferring the icon and falling back to the logo
            map((response) => response.response?.icon?.image || response.response?.logo?.image),
            // Filter out the possibility of not getting a url
            filter((url) => Boolean(url)),
            // Create a read stream from brandfetch to store the image
            switchMap((url) => this.createImageReadStream(url))
        )
    }

    private createImageReadStream(url: string): Observable<stream.Readable> {
        return this.httpService
            .get<stream.Readable>(url, {
                responseType: 'stream'
            })
            .pipe(map((response) => response.data))
    }

    private fetchBrandfetchLogo(clearbitResponse: ClearbitCompanyResponse): Observable<BrandfetchResponse | null> {
        const brandfetchResponse$ = this.httpService.post<BrandfetchResponse>(
            `https://api.brandfetch.io/v1/logo`,
            {
                domain: clearbitResponse.domain
            },
            {
                headers: {
                    'x-api-key': this.configService.get(Environment.BRANDFETCH_API_KEY),
                    'Content-Type': 'application/json'
                }
            }
        )

        return brandfetchResponse$.pipe(map((response) => response.data))
    }

    private fetchCompanyDetails(name: string): Observable<ClearbitCompanyResponse | null> {
        return this.httpService
            .get<ClearbitCompanyResponse[]>(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${name}`)
            .pipe(
                map((response) => response.data),
                filter((data) => Boolean(data)),
                map((data) => this.createBestMatchGuess(name, data)),
                filter((data) => Boolean(data))
            )
    }

    /**
     * If we search for a company name like "Trello" we can get back multiple
     * responses. The heuristic we use to pick a domain, which ultimately leads to a
     * logo is the levenshtein distance between the requested name and the company
     * name in the response.
     *
     * @param requestedName
     * @param companies
     * @private
     */
    private createBestMatchGuess(
        requestedName: string,
        companies: ClearbitCompanyResponse[]
    ): ClearbitCompanyResponse | null {
        if (companies.length === 0) {
            return null
        }

        const scores = companies.map((company) => get(requestedName, company.name))
        let lowestScoreIndex = 0
        scores.forEach((score, index) => {
            if (score < scores[lowestScoreIndex]) {
                lowestScoreIndex = index
            }
        })

        return companies[lowestScoreIndex]
    }
}
