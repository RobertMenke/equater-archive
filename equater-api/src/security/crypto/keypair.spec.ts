import { AsymmetricEncryption } from './AsymmetricEncryption'
import { KeyPair } from './KeyPair'

describe('KeyPair', () => {
    it('should create a keypair that can be used with asymmetric key wrapping', async () => {
        const keypair = await KeyPair.create()
        const plaintext = 'hello world'
        const token = AsymmetricEncryption.encryptWithKeyWrap(plaintext, keypair.getPublicKey())
        const decrypted = AsymmetricEncryption.decryptWithKeyWrap(token, keypair.getPrivateKey())
        expect(plaintext).not.toBe(token)
        expect(plaintext).toBe(decrypted)
    })
})
