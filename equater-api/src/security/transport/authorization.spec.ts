import { KeyPair } from '../crypto/KeyPair'
import { NotBeforeError, TokenExpiredError } from 'jsonwebtoken'
import { Authorization } from './Authorization'

interface Payload {
    data: string
}

describe('Authorization', () => {
    let keypair: KeyPair

    beforeEach(async () => {
        keypair = await KeyPair.create()
    })

    it('should return the original uuid', () => {
        const authorization = new Authorization(keypair.getPublicKey(), keypair.getPrivateKey())
        const payload = {
            data: 'hello world'
        }
        const token = authorization.createBearerToken(payload)
        const plaintext = authorization.extractData<Payload>(token)
        expect(token).not.toBe(payload)
        expect(payload.data).toBe(plaintext.data)
    })

    it('should allow for custom jwt claims passed in as signing options', () => {
        const authorization = new Authorization(keypair.getPublicKey(), keypair.getPrivateKey())
        const payload = {
            data: 'hello world'
        }
        const token = authorization.createBearerToken(payload, {
            expiresIn: 1
        })
        const plaintext = authorization.extractData<Payload>(token)
        expect(token).not.toBe(payload)
        expect(payload.data).toBe(plaintext.data)
    })

    it('should automatically validate expiration', async () => {
        const authorization = new Authorization(keypair.getPublicKey(), keypair.getPrivateKey())
        const payload = {
            data: 'hello world'
        }
        const token = authorization.createBearerToken(payload, {
            expiresIn: 1
        })
        await wait(2000)
        expect(() => {
            const plaintext = authorization.extractData<Payload>(token)
            expect(token).not.toBe(payload)
            expect(payload.data).toBe(plaintext.data)
        }).toThrow(TokenExpiredError)
    })

    it('should automatically validate not before', async () => {
        const authorization = new Authorization(keypair.getPublicKey(), keypair.getPrivateKey())
        const payload = {
            data: 'hello world'
        }
        const token = authorization.createBearerToken(payload, {
            notBefore: 2
        })
        await wait(1000)
        expect(() => {
            const plaintext = authorization.extractData<Payload>(token)
            expect(token).not.toBe(payload)
            expect(payload.data).toBe(plaintext.data)
        }).toThrow(NotBeforeError)
    })

    it('should be able to handle communication between 2 parties', async () => {
        const otherServer = await KeyPair.create()
        const authOne = new Authorization(otherServer.getPublicKey(), keypair.getPrivateKey())
        const authTwo = new Authorization(keypair.getPublicKey(), otherServer.getPrivateKey())

        const payload = {
            data: 'hello world'
        }
        const jwt = authOne.createBearerToken(payload)
        const decodedPayload = authTwo.extractData<Payload>(jwt)

        expect(decodedPayload.data).toBe(payload.data)
    })
})

function wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration)
    })
}
