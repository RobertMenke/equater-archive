import { AsymmetricEncryption } from '../crypto/AsymmetricEncryption'
import { SignOptions, VerifyOptions } from 'jsonwebtoken'
import * as jwt from 'jsonwebtoken'

//data is an encrypted string
export interface JWTClaim<T> extends SignOptions {
    data: string
    getData(privateKey: Buffer): T
}

export class Authorization {
    private readonly publicKey: Buffer
    private readonly privateKey: Buffer

    constructor(publicKey: Buffer, privateKey: Buffer) {
        this.publicKey = publicKey
        this.privateKey = privateKey
    }

    /**
     * The jwt.sign operation is synchronous, but the callback API is also synchronous
     * so there's no reason to use it.
     *
     * @param payload
     * @param options
     */
    public createBearerToken<T extends object>(payload: T, options: SignOptions = {}): string {
        const plaintext = JSON.stringify(payload)
        const data = {
            data: AsymmetricEncryption.encryptWithKeyWrap(plaintext, this.publicKey)
        }

        return jwt.sign(data, this.privateKey, { ...options, algorithm: 'RS256' })
    }

    /**
     * Extract only the original data from the JWT claim
     *
     * @param token
     * @param options
     *
     * @return T
     */
    public extractData<T>(token: string, options: VerifyOptions = {}): T {
        const claim = this.extractJwtClaim<T>(token, options)

        return claim.getData(this.privateKey)
    }

    /**
     * @param token
     * @param options
     */
    private extractJwtClaim<T>(token: string, options: VerifyOptions = {}): JWTClaim<T> {
        //@ts-ignore - jsonwebtoken provides incorrect contributionType definitions
        const payloadWithSignOptions: JWTClaim<T> = jwt.verify(token, this.publicKey, {
            ...options,
            algorithms: ['RS256']
        })

        //memoize encrypted result for scenarios where the API may want to
        //call extractJwtClaim repetitively
        let decryptedData: T

        return {
            ...payloadWithSignOptions,
            getData(privateKey: Buffer): T {
                if (decryptedData) {
                    return decryptedData
                }

                const decrypted = AsymmetricEncryption.decryptWithKeyWrap(payloadWithSignOptions.data, privateKey)

                return (decryptedData = JSON.parse(decrypted))
            }
        }
    }
}
