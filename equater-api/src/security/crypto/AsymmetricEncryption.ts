import { publicEncrypt, privateDecrypt, constants, randomBytes } from 'crypto'
import { base64Decode, base64Encode } from '../../utils/data.utils'
import { SymmetricEncryption } from './SymmetricEncryption'
import { InvalidTokenException } from './exceptions/InvalidTokenException'

interface AsymmetricTokenContents {
    ciphertext: string
    symmetricKey: Buffer
    hmacKey: Buffer
}

export const AsymmetricEncryption = {
    encrypt(plainText: Buffer, publicKey: Buffer): Buffer {
        return publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(plainText))
    },

    decrypt(cipherText: Buffer, privateKey: Buffer): Buffer {
        return privateDecrypt(
            {
                key: privateKey,
                padding: constants.RSA_PKCS1_PADDING
            },
            cipherText
        )
    },

    encryptWithKeyWrap(plainText: string, publicKey: Buffer): string {
        const symmetricKey: Buffer = randomBytes(32)
        const hmacKey: Buffer = randomBytes(32)
        const symmetricEncryption: SymmetricEncryption = new SymmetricEncryption(symmetricKey, hmacKey)
        const cipherText = symmetricEncryption.encrypt(plainText)
        const wrappedKey = this.encrypt(symmetricKey, publicKey)

        return encode(cipherText, wrappedKey, hmacKey)
    },

    decryptWithKeyWrap(token: string, privateKey: Buffer) {
        const { symmetricKey, hmacKey, ciphertext } = decode(token)
        const unwrappedKey = this.decrypt(symmetricKey, privateKey)
        const symmetricEncryption = new SymmetricEncryption(unwrappedKey, hmacKey)

        return symmetricEncryption.decrypt(ciphertext)
    }
}

function encode(cipherText: string, key: Buffer, hmacKey: Buffer): string {
    return `${base64Encode(cipherText)}.${key.toString('base64')}.${hmacKey.toString('base64')}`
}

function decode(encoded: string): AsymmetricTokenContents {
    const tokens = encoded.split('.')

    if (!tokens || tokens.length !== 3) {
        throw new InvalidTokenException()
    }

    return {
        ciphertext: base64Decode(tokens[0]),
        symmetricKey: Buffer.from(tokens[1], 'base64'),
        hmacKey: Buffer.from(tokens[2], 'base64')
    }
}
