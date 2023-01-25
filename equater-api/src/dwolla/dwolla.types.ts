export enum DwollaCustomerType {
    BUSINESS = 'business',
    PERSONAL = 'personal'
}

export interface UnverifiedPersonalCustomerRequest {
    firstName: string
    lastName: string
    email: string
    correlationId: string
}

export interface VerifiedPersonalCustomerRequest extends UnverifiedPersonalCustomerRequest {
    type: DwollaCustomerType
    address1: string
    address2: string
    city: string
    state: string
    postalCode: string
    dateOfBirth: string
    ssn: string
}

export interface DwollaFundingSourceDto {
    routingNumber: string
    accountNumber: string
    bankAccountType: string
    name: string
    plaidToken: string
}

export interface DwollaTransferRequestDto {
    _links: {
        source: {
            href: string
        }
        destination: {
            href: string
        }
    }
    amount: {
        currency: string
        value: string
    }
    fees: DwollaFee[]
    metadata?: {
        paymentId: string
        note: string
    }
    clearing: {
        destination: string //'next-available'
    }
    correlationId: string
}

export interface DwollaFee {
    _links: {
        'charge-to': {
            href: string
        }
    }
    amount: {
        value: string
        currency: string
    }
}

export interface DwollaCustomer {
    _links: {
        deactivate: {
            href: string
            type: string
            'resource-type': string
        }
        self: {
            href: string
            type: string
            'resource-type': string
        }
        receive: {
            href: string
            type: string
            'resource-type': string
        }
        'edit-form': {
            href: string
            type: string
            'resource-type': string
        }
        edit: {
            href: string
            type: string
            'resource-type': string
        }
        'funding-sources': {
            href: string
            type: string
            'resource-type': string
        }
        transfers: {
            href: string
            type: string
            'resource-type': string
        }
        send: {
            href: string
            type: string
            'resource-type': string
        }
    }
    id: string
    firstName: string
    lastName: string
    email: string
    type: 'personal' | 'business'
    status: 'verified' | 'unverified'
    created: string
    address1: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    correlationId: string
}

export interface DwollaFundingSource {
    _links: {
        'transfer-from-balance': {
            href: string
            type: string
            'resource-type': string
        }
        self: {
            href: string
            type: string
            'resource-type': string
        }
        'transfer-to-balance': {
            href: string
            type: string
            'resource-type': string
        }
        'transfer-send': {
            href: string
            type: string
            'resource-type': string
        }
        remove: {
            href: string
            type: string
            'resource-type': string
        }
        customer: {
            href: string
            type: string
            'resource-type': string
        }
        'transfer-receive': {
            href: string
            type: string
            'resource-type': string
        }
        balance?: {
            href: string
            type: string
            'resource-type': string
        }
    }
    id: string
    status: string
    type: string
    bankAccountType: string
    name: string
    created: string
    removed: boolean
    channels: string[]
    bankName: string
    fingerprint: string
}

export interface DwollaTransferResponse {
    _embedded: {
        transfers: DwollaTransfer[]
    }
}

export interface DwollaTransfer {
    _links: {
        cancel: {
            href: string
            type: string
            'resource-type': string
        }
        source: {
            href: string
            type: string
            'resource-type': string
        }
        'funding-transfer': {
            href: string
            type: string
            'resource-type': string
        }
        'destination-funding-source': {
            href: string
            type: string
            'resource-type': string
        }
        self: {
            href: string
            type: string
            'resource-type': string
        }
        'source-funding-source': {
            href: string
            type: string
            'resource-type': string
        }
        fees: {
            href: string
            type: string
            'resource-type': string
        }
        destination: {
            href: string
            type: string
            'resource-type': string
        }
    }
    id: string
    status: DwollaTransferStatus
    amount: {
        value: string
        currency: string
    }
    created: string
    clearing: {
        source: string
        destination: string
    }
    correlationId: string
}

export enum DwollaTransferStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface DwollaCustomerFundingSources {
    _links: {
        self: {
            href: string
            type: string
            'resource-type': string
        }
        customer: {
            href: string
            type: string
            'resource-type': string
        }
    }
    _embedded: {
        'funding-sources': DwollaFundingSource[]
    }
}

// https://docs.dwolla.com/#retrieve-a-funding-source-balance
export interface DwollaBalanceResponse {
    _links: {
        self: {
            href: string
            type: string
            'resource-type': string
        }
        'funding-source': {
            href: string
            type: string
            'resource-type': string
        }
    }
    balance: DwollaBalance
    total: DwollaBalance
    lastUpdated: string //'2021-11-08T19:25:59.915Z'
}

export interface DwollaBalance {
    value: string //'0.00'
    currency: string //'USD'
}

// Our concept of a balance will include a slice of the details from the funding source
export interface Balance extends DwollaBalance {
    dineroValueRepresentation: number
    id: string
    status: string
    type: string
    bankAccountType: string
    name: string
    created: string
    removed: boolean
    channels: string[]
    bankName: string
    fingerprint: string
}
