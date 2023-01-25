import { createCipheriv, randomBytes, createDecipheriv, createHmac } from 'crypto'
import { InvalidTokenException } from './exceptions/InvalidTokenException'
import { UnsupportedAlgorithmException } from './exceptions/UnsupportedAlgorithmException'

// "openssl list -cipher-algorithms" from the cli will show options
export enum AlgorithmIdentifier {
    AES_256_CBC = '1'
}

interface SymmetricTokenComponents {
    identifier: Buffer
    iv: Buffer
    encryptedText: Buffer
    expectedHmac: string
}

const TOKEN_DELIMITER = '.'
const HMAC_ALGORITHM = 'SHA256'
const IV_LENGTH_IN_BYTES = 16

export class SymmetricEncryption {
    private readonly symmetricKey: Buffer
    private readonly hmacKey: Buffer

    constructor(symmetricKey: Buffer, hmacKey: Buffer) {
        this.symmetricKey = symmetricKey
        this.hmacKey = hmacKey
    }

    /**
     * Final token should be [identifier] . [iv] . [ciphertext] . [hmac]
     *
     * @param plaintext
     * @param algorithmIdentifier
     */
    public encrypt(
        plaintext: string,
        algorithmIdentifier: AlgorithmIdentifier = AlgorithmIdentifier.AES_256_CBC
    ): string {
        const iv = randomBytes(IV_LENGTH_IN_BYTES)
        const algorithm = this.getAlgorithm(algorithmIdentifier)
        const cipher = createCipheriv(algorithm, this.symmetricKey, iv)
        const encrypted = cipher.update(plaintext)
        const ciphertext = Buffer.concat([encrypted, cipher.final()])
        const token = this.createToken(algorithmIdentifier, iv, ciphertext)
        const hmacOfToken = this.createHMAC(token)

        return token + TOKEN_DELIMITER + hmacOfToken
    }

    /**
     * @param ciphertext
     */
    public decrypt(ciphertext: string): string {
        const extractedToken = this.extractToken(ciphertext)

        if (Object.keys(extractedToken).some((key) => !extractedToken[key])) {
            throw new InvalidTokenException()
        }

        if (!this.validateHmac(extractedToken)) {
            throw new InvalidTokenException('Invalid HMAC')
        }

        const algorithm = this.getSymmetricAlgorithmFromIdentifier(extractedToken.identifier.toString('utf8'))
        const decipher = createDecipheriv(algorithm, this.symmetricKey, extractedToken.iv)
        const output = decipher.update(extractedToken.encryptedText)
        const buffer = Buffer.concat([output, decipher.final()])

        return buffer.toString('utf8')
    }

    private validateHmac(extractedToken: SymmetricTokenComponents) {
        const algorithmIdentifier = this.getAlgorithmIdentifier(extractedToken.identifier.toString('utf8'))
        const token = this.createToken(algorithmIdentifier, extractedToken.iv, extractedToken.encryptedText)
        const hmacOfToken = this.createHMAC(token)

        return hmacOfToken === extractedToken.expectedHmac
    }

    /**
     * @param algorithmIdentifier
     */
    private getAlgorithm(algorithmIdentifier: AlgorithmIdentifier) {
        switch (algorithmIdentifier) {
            case AlgorithmIdentifier.AES_256_CBC:
                return 'aes-256-cbc'
            default:
                throw new UnsupportedAlgorithmException()
        }
    }

    private getSymmetricAlgorithmFromIdentifier(identifier: string): string {
        return this.getAlgorithm(this.getAlgorithmIdentifier(identifier))
    }

    private getAlgorithmIdentifier(identifier: string) {
        switch (identifier) {
            case AlgorithmIdentifier.AES_256_CBC:
                return AlgorithmIdentifier.AES_256_CBC
            default:
                throw new UnsupportedAlgorithmException()
        }
    }

    private createToken(algorithm: AlgorithmIdentifier, iv: Buffer, ciphertext: Buffer) {
        return (
            Buffer.from(algorithm).toString('base64') +
            TOKEN_DELIMITER +
            iv.toString('base64') +
            TOKEN_DELIMITER +
            ciphertext.toString('base64')
        )
    }

    private extractToken(ciphertext: string): SymmetricTokenComponents {
        const [identifier, iv, encryptedText, expectedHmac] = ciphertext.split(TOKEN_DELIMITER)

        return {
            identifier: Buffer.from(identifier, 'base64'),
            iv: Buffer.from(iv, 'base64'),
            encryptedText: Buffer.from(encryptedText, 'base64'),
            expectedHmac
        }
    }

    /**
     * Use node.js built in utility to create and HMAC
     *
     * @param { String } payload
     * @return { String}
     */
    private createHMAC(payload: string): string {
        return createHmac(HMAC_ALGORITHM, this.hmacKey).update(payload).digest('hex')
    }
}
