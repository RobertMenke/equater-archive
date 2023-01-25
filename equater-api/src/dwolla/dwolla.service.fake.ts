import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Client as DwollaClient, Response } from 'dwolla-v2'
import { faker } from '@faker-js/faker'
import { Headers } from 'node-fetch'
import { v4 as uuid } from 'uuid'
import { DWOLLA_CLIENT, USD } from '../config/constants'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { User } from '../user/user.entity'
import { UserAccount } from '../user_account/user-account.entity'
import { makeDinero } from '../utils/data.utils'
import {
    Balance,
    DwollaCustomer,
    DwollaFundingSource,
    DwollaFundingSourceDto,
    DwollaTransfer,
    DwollaTransferResponse,
    DwollaTransferStatus
} from './dwolla.types'

class FakeResponse implements Response {
    public status: number
    // @ts-ignore
    public headers: Headers
    public body: any
    constructor() {
        this.status = 200
        this.headers = new Headers()
        this.body = {}
    }
}

@Injectable()
export class DwollaServiceFake {
    static CREATE_TRANSFER_RESPONSE = HttpStatus.CREATED
    static GET_CUSTOMER_STATUS: 'verified' | 'unverified' = 'verified'
    static FIND_PENDING_TRANSFERS = false
    static TRANSFER_STATUS = DwollaTransferStatus.PENDING
    static CUSTOMER_BALANCE = faker.datatype.number(1000)
    constructor(@Inject(DWOLLA_CLIENT) private readonly dwollaClient: DwollaClient) {}

    async getCustomer(user: User): Promise<DwollaCustomer> {
        return {
            _links: {
                deactivate: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                self: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                receive: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                'edit-form': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                edit: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                'funding-sources': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                transfers: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                send: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                }
            },
            id: user.uuid,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            type: 'personal',
            status: DwollaServiceFake.GET_CUSTOMER_STATUS,
            created: new Date().toISOString(),
            address1: user.addressOne,
            city: user.city,
            state: user.state,
            postalCode: user.postalCode,
            correlationId: user.uuid
        }
    }

    async getCustomerBalance(user: User): Promise<Balance[]> {
        const dinero = makeDinero(DwollaServiceFake.CUSTOMER_BALANCE)

        return [
            {
                value: dinero.toFormat('0,0.00'),
                currency: USD,
                dineroValueRepresentation: dinero.getAmount(),
                id: faker.lorem.word(),
                status: faker.lorem.word(),
                type: faker.lorem.word(),
                bankAccountType: faker.lorem.word(),
                name: faker.lorem.word(),
                created: faker.lorem.word(),
                removed: faker.datatype.boolean(),
                channels: ['ach'],
                bankName: faker.lorem.word(),
                fingerprint: faker.lorem.word()
            }
        ]
    }

    /**
     * @see https://docs.dwolla.com/#create-a-customer
     * @param user
     */
    createCustomer(user: User): Promise<Response> {
        const response = new FakeResponse()
        response.headers.set('location', `https://api-sandbox.dwolla.com/customers/${uuid()}`)

        // @ts-ignore
        return Promise.resolve(response)
    }

    updateDwollaCustomer(user: User): Promise<Response> {
        const response = new FakeResponse()
        response.headers.set('location', `https://api-sandbox.dwolla.com/customers/${user.dwollaCustomerId}`)

        // @ts-ignore
        return Promise.resolve(response)
    }

    deactivateCustomer(user: User): Promise<Response> {
        const response = new FakeResponse()
        response.headers.set('location', `https://api-sandbox.dwolla.com/customers/${user.dwollaCustomerId}`)

        // @ts-ignore
        return Promise.resolve(response)
    }

    /**
     * @see https://docs.dwolla.com/#create-a-funding-source-for-a-customer
     * @param user
     * @param source
     */
    createFundingSource(user: User, source: DwollaFundingSourceDto): Promise<Response> {
        const response = new FakeResponse()
        response.headers.set('location', `https://api-sandbox.dwolla.com/funding-sources/${uuid()}`)

        // @ts-ignore
        return Promise.resolve(response)
    }

    getFundingSource(account: UserAccount) {
        return Promise.resolve({
            _links: {
                'transfer-from-balance': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                self: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                'transfer-to-balance': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                'transfer-send': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                remove: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                customer: {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                },
                'transfer-receive': {
                    href: faker.internet.url(),
                    type: faker.lorem.word(),
                    'resource-type': faker.lorem.word()
                }
            },
            id: faker.lorem.word(),
            status: faker.lorem.word(),
            type: faker.lorem.word(),
            bankAccountType: faker.lorem.word(),
            name: faker.lorem.word(),
            created: faker.lorem.word(),
            removed: faker.datatype.boolean(),
            channels: ['ach'],
            bankName: faker.lorem.word(),
            fingerprint: faker.lorem.word()
        })
    }

    getFundingSources(user: User): Promise<DwollaFundingSource[]> {
        return Promise.resolve([
            {
                _links: {
                    'transfer-from-balance': {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    self: {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    'transfer-to-balance': {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    'transfer-send': {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    remove: {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    customer: {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    },
                    'transfer-receive': {
                        href: faker.internet.url(),
                        type: faker.lorem.word(),
                        'resource-type': faker.lorem.word()
                    }
                },
                id: faker.lorem.word(),
                status: faker.lorem.word(),
                type: faker.lorem.word(),
                bankAccountType: faker.lorem.word(),
                name: faker.lorem.word(),
                created: faker.lorem.word(),
                removed: faker.datatype.boolean(),
                channels: ['ach'],
                bankName: faker.lorem.word(),
                fingerprint: faker.lorem.word()
            }
        ])
    }

    async removeFundingSource(account: UserAccount) {}

    async cancelTransfer(transfer: SharedExpenseTransaction): Promise<void> {}

    /**
     * https://docs.dwolla.com/#initiate-a-transfer
     *
     * @param sourceAccount
     * @param destinationAccount
     * @param transaction
     */
    async createTransfer(
        sourceAccount: UserAccount,
        destinationAccount: UserAccount,
        transaction: SharedExpenseTransaction
    ) {
        const body = {
            status: DwollaServiceFake.TRANSFER_STATUS
        }
        const response = new FakeResponse()

        response.status = DwollaServiceFake.CREATE_TRANSFER_RESPONSE
        response.body = body
        response.headers.set('location', `https://api-sandbox.dwolla.com/transfers/${uuid()}`)

        return Promise.resolve(response)
    }

    async getTransfer(transaction: SharedExpenseTransaction): Promise<DwollaTransfer> {
        // @ts-ignore
        return {
            status: DwollaServiceFake.TRANSFER_STATUS
        }
    }

    async getTransfers(user: User, byStatus?: DwollaTransferStatus): Promise<DwollaTransferResponse> {
        if (DwollaServiceFake.FIND_PENDING_TRANSFERS) {
            return {
                _embedded: {
                    transfers: [
                        // @ts-ignore
                        {
                            status: DwollaTransferStatus.PENDING
                        }
                    ]
                }
            }
        }

        return {
            _embedded: {
                transfers: []
            }
        }
    }
}
