export class InvalidTokenException extends Error {
    constructor(message: string = 'Invalid token') {
        super(message)
    }
}
