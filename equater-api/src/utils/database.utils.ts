import { fold, fromNullable } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/function'
import { ValueTransformer } from 'typeorm'
import { configService, Environment } from '../config/config.service'
import { AsymmetricEncryption } from '../security/crypto/AsymmetricEncryption'

export const nullableEncryptionTransformer: ValueTransformer = {
    from(value: string | null) {
        return pipe(
            fromNullable(value),
            fold(
                () => null,
                (token) => AsymmetricEncryption.decryptWithKeyWrap(token, configService.getKey(Environment.PRIVATE_KEY))
            )
        )
    },
    to(value: string | null) {
        return pipe(
            fromNullable(value),
            fold(
                () => null,
                (token) => AsymmetricEncryption.encryptWithKeyWrap(token, configService.getKey(Environment.PUBLIC_KEY))
            )
        )
    }
}

export const encryptionTransformer: ValueTransformer = {
    from(value: string) {
        return AsymmetricEncryption.decryptWithKeyWrap(value, configService.getKey(Environment.PRIVATE_KEY))
    },
    to(value: string | null) {
        return AsymmetricEncryption.encryptWithKeyWrap(value, configService.getKey(Environment.PUBLIC_KEY))
    }
}
