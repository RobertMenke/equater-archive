import { AsymmetricEncryption } from './AsymmetricEncryption'
import { KeyPair } from './KeyPair'

describe('Asymmetric Encryption', () => {
    it('should encrypt/decrypt via a keypair generated by node', async () => {
        const keypair = await KeyPair.create()
        const plaintext = Buffer.from('hello world')
        const token = AsymmetricEncryption.encrypt(plaintext, keypair.getPublicKey())
        expect(token.toString('utf8')).not.toBe(plaintext.toString('utf8'))
        const decrypted = AsymmetricEncryption.decrypt(token, keypair.getPrivateKey())
        expect(decrypted.toString('utf8')).toBe(plaintext.toString('utf8'))
    })

    it('should be able to do asymmetric key wrapping', async () => {
        const keypair = await KeyPair.create()
        const plaintext = 'hello world'
        const ciphertext = AsymmetricEncryption.encryptWithKeyWrap(plaintext, keypair.getPublicKey())
        const decrypted = AsymmetricEncryption.decryptWithKeyWrap(ciphertext, keypair.getPrivateKey())

        expect(ciphertext).not.toBe(plaintext)
        expect(decrypted).toBe(plaintext)
    })
})
