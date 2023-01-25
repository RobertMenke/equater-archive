import { randomBytes } from 'crypto'
import { InvalidTokenException } from './exceptions/InvalidTokenException'
import { SymmetricEncryption } from './SymmetricEncryption'

describe('Symmetric Encryption', () => {
    let symmetricKey: Buffer
    let hmacKey: Buffer

    beforeEach(() => {
        symmetricKey = randomBytes(32)
        hmacKey = randomBytes(32)
    })

    it('should encrypt and decrypt plaintext as expected', () => {
        const plaintext = 'hello crypto'
        const encryption = new SymmetricEncryption(symmetricKey, hmacKey)

        const ciphertext = encryption.encrypt(plaintext)
        const decrypted = encryption.decrypt(ciphertext)
        expect(decrypted).toBe(plaintext)
    })

    it('should work across multiple class instances', () => {
        const plaintext = 'hello crypto'
        const encryption = new SymmetricEncryption(symmetricKey, hmacKey)
        const decryption = new SymmetricEncryption(symmetricKey, hmacKey)
        const ciphertext = encryption.encrypt(plaintext)
        expect(ciphertext).not.toBe(plaintext)
        const decrypted = decryption.decrypt(ciphertext)
        expect(decrypted).toBe(plaintext)
    })

    it('should throw when incorrect keys are used', () => {
        const plaintext = 'hello crypto'
        const encryption = new SymmetricEncryption(symmetricKey, hmacKey)
        const decryption = new SymmetricEncryption(randomBytes(16), randomBytes(16))
        const ciphertext = encryption.encrypt(plaintext)
        expect(() => {
            decryption.decrypt(ciphertext)
        }).toThrow(InvalidTokenException)
    })

    it('should throw given invalid ciphertext', () => {
        const plaintext = 'hello crypto'
        const encryption = new SymmetricEncryption(symmetricKey, hmacKey)
        const ciphertext = encryption.encrypt(plaintext) + 'abcd'
        expect(() => {
            encryption.decrypt(ciphertext)
        }).toThrow(InvalidTokenException)
    })
})
