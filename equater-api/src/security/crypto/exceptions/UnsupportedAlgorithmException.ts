export class UnsupportedAlgorithmException extends Error {
    constructor(message: string = 'Unsupported algorithm in token') {
        super(message)
    }
}
