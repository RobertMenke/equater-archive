import { Logger } from '@nestjs/common'
import { AxiosError } from 'axios'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import * as Dinero from 'dinero.js'
import * as stream from 'stream'
import { BCRYPT_ROUNDS, USD } from '../config/constants'

// @ts-ignore
export const log = <T>(value: T): T => console.log(value) || value

export enum HashAlgorithm {
    SHA256 = 'sha256'
}

export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export function hashReadStream(readStream: stream.Readable, algorithm: HashAlgorithm): Promise<string> {
    const hash = crypto.createHash(algorithm)

    return new Promise((resolve, reject) => {
        readStream.on('data', (chunk) => hash.update(chunk))
        readStream.on('error', (e) => reject(e))
        readStream.on('end', () => resolve(hash.digest('hex')))
    })
}

export function base64Encode(data: string): string {
    return Buffer.from(data, 'utf8').toString('base64')
}

export function base64Decode(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8')
}

export function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min)
}

export function removeNullKeys<T extends object>(data: T): Partial<T> {
    const output = {} as Partial<T>
    const keys = Object.keys(data)
    for (const key of keys) {
        if (data[key]) {
            output[key] = data[key]
        }
    }

    return output
}

/**
 * Note: This is assuming that a comparison like (T, T) => boolean can be performed accurately via a === comparison
 *
 * @param list
 */
export function removeDuplicates<T>(list: T[]): T[] {
    const seen = new Map<T, number>()
    const out = []
    const length = list.length
    let j = 0

    for (let i = 0; i < length; i++) {
        const item = list[i]
        if (!seen.has(item)) {
            seen.set(item, 1)
            out[j++] = item
        }
    }

    return out
}

export function removeDuplicatesWithSelector<T, V>(list: T[], f: (item: T) => V): T[] {
    const seen = new Map<V, number>()
    const out = []
    const length = list.length
    let j = 0
    for (let i = 0; i < length; i++) {
        const item = list[i]
        const key = f(item)
        if (!seen.has(key)) {
            seen.set(key, 1)
            out[j++] = item
        }
    }

    return out
}

/**
 * Sequentially execute async code.
 *
 * @param list
 * @param f
 */
export async function mapAsyncSequential<T, R>(list: T[], f: (val: T) => Promise<R>): Promise<R[]> {
    let result: R[] = []

    for (const item of list) {
        result.push(await f(item))
    }

    return result
}

export async function mapNotNullAsync<T, R>(list: T[], f: (val: T) => Promise<R | null>): Promise<R[]> {
    const results = await Promise.all(list.map(f))

    return results.filter(Boolean)
}

export function repeat(repetitions: number, f: () => void) {
    for (let i = 0; i < repetitions; i++) {
        f()
    }
}

export async function repeatAsync(repetitions: number, f: (index: number) => Promise<void>) {
    for (let i = 0; i < repetitions; i++) {
        await f(i)
    }
}

export function generate<R>(repetitions: number, f: (index: number) => R): R[] {
    const output = []

    for (let i = 0; i < repetitions; i++) {
        output.push(f(i))
    }

    return output
}

/**
 * Given a number of repetitions, create a list
 *
 * @param repetitions
 * @param f
 */
export async function generateAsync<R>(repetitions: number, f: (index: number) => Promise<R>): Promise<R[]> {
    const output = []

    for (let i = 0; i < repetitions; i++) {
        output.push(await f(i))
    }

    return output
}

export function mapAsync<T, R>(list: T[], f: (val: T, index?: number) => Promise<R>): Promise<R[]> {
    return Promise.all(list.map(f))
}

export async function flatMapAsync<T, R>(list: T[], f: (val: T, index?: number) => Promise<R[]>): Promise<R[]> {
    const stacked = await mapAsync(list, f)

    return stacked.flat()
}

export function asyncAfter<R>(deadline: number, f: () => Promise<R>): Promise<R> {
    return new Promise((resolve) => {
        setTimeout(async () => {
            resolve(await f())
        }, deadline)
    })
}

export async function filterAsync<T>(list: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]> {
    const output = []

    for (const item of list) {
        if (await predicate(item)) {
            output.push(item)
        }
    }

    return output
}

/**
 * Format a list of names like ["John", "Tim", "Bob"] into a string like
 * John, Tim, and Bob
 *
 * @param names
 */
export function formatListOfNames(names: string[]): string {
    if (names.length === 1) {
        return names[0]
    }

    if (names.length == 2) {
        return `${names[0]} and ${names[1]}`
    }

    return names.reduce((acc, name, index) => {
        if (index === names.length - 1) {
            return `${acc}and ${name}`
        }

        return `${acc}, `
    }, '')
}

export function removeHoursMinutesSeconds(date: Date): Date {
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)

    return date
}

export enum BinaryStatus {
    IS_ACTIVE,
    IS_INACTIVE
}

// In some very strange cases, fractional cents can be thrown
// around. This construct here ensures we don't try to give dinero a float.
export function makeDinero(amount: number): Dinero.Dinero {
    if (Number.isInteger(amount)) {
        return Dinero({ amount: amount, precision: 2, currency: USD })
    }

    return Dinero({ amount: Math.floor(amount), precision: 2, currency: USD })
}

export function logError(logger: Logger, error: Error | AxiosError | any) {
    if (error?.response?.data) {
        return logAxiosError(logger, error)
    }

    if (error instanceof Error) {
        return logger.error(`Error Message: ${error.message} -- Trace: ${error.stack}`)
    }

    // Fall back to trying to log whatever this is with a stack trace. Since errors
    // can be thrown by 3rd party libraries we can't guarantee that we'll get back
    // and instance of Error, even though it would be insane for a 3rd party lib to
    // send us something that is not an Error instance.
    const err = new Error(JSON.stringify(error))
    logger.error(`Error Message: ${err.message} -- Trace: ${err.stack}`)
}

function logAxiosError(logger: Logger, err: AxiosError) {
    logger.error(
        `Error Message: ${err.message} -- Trace: ${err.stack} -- Axios Error Data: ${JSON.stringify(err.response.data)}`
    )
}
