import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import * as dotenv from 'dotenv'
import { PlaidEnvironments } from 'plaid'

export enum Environment {
    ANDROID_PACKAGE_NAME = 'ANDROID_PACKAGE_NAME',
    API_BASE = 'API_BASE',
    AWS_REGION = 'AWS_REGION',
    BRANDFETCH_API_KEY = 'BRANDFETCH_API_KEY',
    DATABASE_URL = 'DATABASE_URL',
    DB_ENGINE = 'DB_ENGINE',
    DB_NAME = 'DB_NAME',
    DWOLLA_ENVIRONMENT = 'DWOLLA_ENVIRONMENT',
    DWOLLA_PUBLIC_KEY = 'DWOLLA_PUBLIC_KEY',
    DWOLLA_SECRET_KEY = 'DWOLLA_SECRET_KEY',
    EMAIL_CONFIRMED_EXPIRATION_IN_DAYS = 'EMAIL_CONFIRMED_EXPIRATION_IN_DAYS',
    FIREBASE_ADMIN_SDK_PRIVATE_KEY = 'FIREBASE_ADMIN_SDK_PRIVATE_KEY',
    IS_TESTING = 'IS_TESTING',
    NODE_ENV = 'NODE_ENV',
    PASSWORD_RESET_EXPIRATION_IN_DAYS = 'PASSWORD_RESET_EXPIRATION_IN_DAYS',
    PLAID_CLIENT_ID = 'PLAID_CLIENT_ID',
    PLAID_ENVIRONMENT = 'PLAID_ENVIRONMENT',
    PLAID_SECRET_KEY = 'PLAID_SECRET_KEY',
    PRIVATE_KEY = 'PRIVATE_KEY',
    PUBLIC_KEY = 'PUBLIC_KEY',
    RECURRENT_PAYMENT_QUEUE_DELAY_MILLIS = 'RECURRENT_PAYMENT_QUEUE_DELAY_MILLIS',
    REDIS_URL = 'REDIS_URL',
    REDIS_TLS_URL = 'REDIS_TLS_URL',
    S3_ACCESS_KEY = 'S3_ACCESS_KEY',
    S3_PHOTOS_BUCKET = 'S3_PHOTOS_BUCKET',
    S3_SECRET_KEY = 'S3_SECRET_KEY',
    SENDGRID_API_KEY = 'SENDGRID_API_KEY',
    SENDGRID_FROM_ADDRESS = 'SENDGRID_FROM_ADDRESS',
    WEB_CLIENT = 'WEB_CLIENT',
    VENDOR_ASSETS_S3_BUCKET = 'VENDOR_ASSETS_S3_BUCKET',
    SERVER_ENVIRONMENT = 'SERVER_ENVIRONMENT',
    TWILIO_ACCOUNT_SID = 'TWILIO_ACCOUNT_SID',
    TWILIO_AUTH_TOKEN = 'TWILIO_AUTH_TOKEN',
    TWILIO_ALERT_FROM_NUMBER = 'TWILIO_ALERT_FROM_NUMBER'
}

export enum Provider {
    DWOLLA_CLIENT = 'DWOLLA_CLIENT',
    PLAID_CLIENT = 'PLAID_CLIENT',
    FIREBASE_ADMIN = 'FIREBASE_ADMIN',
    S3_CLIENT = 'S3_CLIENT',
    TWILIO_CLIENT = 'TWILIO_CLIENT',
    AUTHORIZATION_SERVICE = 'AUTHORIZATION_SERVICE'
}

export enum Queues {
    RECURRENT_PAYMENTS = 'RECURRENT_PAYMENTS'
}

// The name passed to the first parameter of queue.add
export enum QueueProcessor {
    RECURRENT_PAYMENT = 'RECURRENT_PAYMENT',
    RECURRENT_PAYMENT_NOTIFICATION = 'RECURRENT_PAYMENT_NOTIFICATION'
}

export enum PlaidEnvironment {
    SANDBOX = 'SANDBOX',
    DEVELOPMENT = 'DEVELOPMENT',
    PRODUCTION = 'PRODUCTION'
}

export type PlaidEnvironmentUrl =
    | typeof PlaidEnvironments.sandbox
    | typeof PlaidEnvironments.development
    | typeof PlaidEnvironments.production

export class ConfigService {
    constructor() {
        if (process.env.NODE_ENV !== 'production' && process.env.CI !== 'true') {
            dotenv.config()
        }
    }

    get(key: Environment): string {
        return process.env[key]
    }

    set(key: Environment, value: string) {
        process.env[key] = value
    }

    getPlaidEnvironment(): PlaidEnvironmentUrl {
        const environment = this.get(Environment.PLAID_ENVIRONMENT)

        switch (environment) {
            case PlaidEnvironment.SANDBOX:
                return PlaidEnvironments.sandbox
            case PlaidEnvironment.DEVELOPMENT:
                return PlaidEnvironments.development
            case PlaidEnvironment.PRODUCTION:
                return PlaidEnvironments.production
            default:
                throw new RuntimeException(`No plaid environment specified`)
        }
    }

    getKey(key: Environment): Buffer {
        return Buffer.from(this.get(key).replace(/\\n/g, '\n'))
    }

    getFirebaseAdminSdkPrivateKey(): string {
        const buffer = Buffer.from(this.get(Environment.FIREBASE_ADMIN_SDK_PRIVATE_KEY), 'base64')

        return JSON.parse(buffer.toString('ascii'))
    }

    /**
     * Heroku hobby environments inject 2 environment variables, REDIS_TLS_URL and REDIS_URL
     */
    getRedisUrl(): string {
        return this.get(Environment.REDIS_TLS_URL) || this.get(Environment.REDIS_URL)
    }

    isDevelopment(): boolean {
        const env = this.get(Environment.NODE_ENV).toLowerCase()

        return env === 'development' || env === 'test' || env === 'ci'
    }

    isProduction(): boolean {
        const env = this.get(Environment.NODE_ENV).toLowerCase()
        const dwollaEnv = this.get(Environment.DWOLLA_ENVIRONMENT).toLowerCase()
        const plaidEnv = this.get(Environment.PLAID_ENVIRONMENT).toLowerCase()

        return env === 'production' && dwollaEnv === 'production' && plaidEnv === 'production'
    }

    isTesting(): boolean {
        return this.get(Environment.IS_TESTING) === 'true'
    }
}

// Keeping this separate instance until I can figure out a way to use the DI system for the database encryption transformers
export const configService = new ConfigService()
