import { generateKeyPair } from 'crypto'
import { promisify } from 'util'

const createKeyPair = promisify(generateKeyPair)

export class KeyPair {
    private readonly publicKey: Buffer
    private readonly privateKey: Buffer

    constructor(publicKey: Buffer, privateKey: Buffer) {
        this.publicKey = publicKey
        this.privateKey = privateKey
    }

    public static async create(): Promise<KeyPair> {
        const { publicKey, privateKey } = await createKeyPair('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        })

        return new KeyPair(Buffer.from(publicKey), Buffer.from(privateKey))
    }

    public getPublicKey(): Buffer {
        return this.publicKey
    }

    public getPrivateKey(): Buffer {
        return this.privateKey
    }
}
