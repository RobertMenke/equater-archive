export const DWOLLA_WEBHOOK_ENDPOINT = 'api/dwolla/webhook'

/**
 * @link https://developers.dwolla.com/concepts/webhook-events#webhook-events
 */
export enum DwollaWebhookEvent {
    // Occurs upon a POST request to the Create a Customer endpoint.
    CUSTOMER_CREATED = 'customer_created',
    // Incomplete information was received for a Customer; updated information is needed to verify the Customer.
    CUSTOMER_REVERIFICATION_NEEDED = 'customer_reverification_needed',
    // Additional documentation is needed to verify a Customer.
    CUSTOMER_VERIFICATION_DOCUMENT_NEEDED = 'customer_verification_document_needed',
    // Occurs when a Customer is verified by Dwolla upon a POST request to the Create a Customer endpoint.
    // In a case where the Customer isn’t instantly verified upon creation, this event occurs when the Customer
    // is verified after a retry attempt, or after a document is approved.
    CUSTOMER_VERIFIED = 'customer_verified',
    // Occurs when Dwolla systematically places a Customer in suspended status as a result of uploading
    // fraudulent document, or upon receiving certain ACH return codes when a transfer fails.
    CUSTOMER_SUSPENDED = 'customer_suspended',
    // Occurs upon reactivating a Customer that has a deactivated status by making a POST request to the
    // Update a Customer endpoint, or when Dwolla reactivates a Customer that has a suspended status.
    CUSTOMER_ACTIVATED = 'customer_activated',
    // Occurs upon deactivation of a Customer by making a POST request to the Update a Customer endpoint,
    // or when Dwolla systematically deactivates a Customer upon receiving certain ACH return codes when a transfer fails.
    CUSTOMER_DEACTIVATED = 'customer_deactivated',
    // Occurs upon a POST request to the Create a funding source for a customer endpoint, or when a
    // funding source is added via dwolla.js or a third party bank verification method.
    CUSTOMER_FUNDING_SOURCE_ADDED = 'customer_funding_source_added',
    // Occurs upon a POST request to the Remove a funding source endpoint, or when Dwolla
    // systematically removes a funding source upon receiving certain ACH return codes when a transfer fails.
    CUSTOMER_FUNDING_SOURCE_REMOVED = 'customer_funding_source_removed',
    // Occurs upon a POST request to the Verify micro-deposits endpoint with the correct amounts, or when a
    // funding source is added + verified via IAV or a third party bank verification method. Also occurs in
    // cases where Dwolla manually marks a funding source as verified.
    CUSTOMER_FUNDING_SOURCE_VERIFIED = 'customer_funding_source_verified',
    // Occurs when Dwolla systematically marks a funding source unverified upon receiving certain ACH
    // return codes when a transfer fails.
    CUSTOMER_FUNDING_SOURCE_UNVERIFIED = 'customer_funding_source_unverified',
    // A Customer’s balance has gone negative. You are responsible for ensuring a zero or positive Dwolla
    // balance for Customer accounts created by your application. If a Customer’s Dwolla balance has gone negative,
    // you are responsible for making the Dwolla Customer account whole. Dwolla will notify you via a webhook and separate email of the negative balance.
    // Timing: Occurs upon a POST request to the Initiate a transfer endpoint that causes a funding source balance to go negative.
    CUSTOMER_FUNDING_SOURCE_NEGATIVE = 'customer_funding_source_negative',
    // A Customer’s funding source has been updated. This can also be fired as a result of a correction after a bank transfer processes.
    // For example, a financial institution can issue a correction to change the bank account type from checking to savings.
    CUSTOMER_FUNDING_SOURCE_UPDATED = 'customer_funding_source_updated',
    // A bank transfer was created for a Customer. Represents funds moving either from a verified Customer’s bank to the
    // Dwolla Platform or from the Dwolla Platform to a verified Customer’s bank.
    CUSTOMER_BANK_TRANSFER_CREATED = 'customer_bank_transfer_created',
    // A pending Customer bank transfer has been cancelled, and will not process further.
    // Represents a cancellation of funds either transferring from a verified Customer’s bank
    // to the Dwolla Platform or from the Dwolla Platform to a verified Customer’s bank.
    CUSTOMER_BANK_TRANSFER_CANCELLED = 'customer_bank_transfer_cancelled',
    // A Customer bank transfer. Usually, this is a result of an ACH failure (insufficient funds, etc.).
    // Represents a failed funds transfer either from a verified Customer’s bank to the Dwolla Platform or from
    // the Dwolla Platform to a verified Customer’s bank.
    CUSTOMER_BANK_TRANSFER_FAILED = 'customer_bank_transfer_failed',
    // Transfers initiated to a verified Customer’s bank must pass through the verified Customer’s balance before being sent to a receiving bank.
    // Dwolla will fail to create a transaction intended for a verified Customer’s bank if the funds available in the balance are less than the transfer amount.
    CUSTOMER_BANK_TRANSFER_CREATION_FAILED = 'customer_bank_transfer_creation_failed',
    // A bank transfer that was created for a Customer was success. Represents a successful funds transfer either from a verified Customer’s
    // bank to the Dwolla Platform or from the Dwolla Platform to a verified Customer’s bank.
    CUSTOMER_BANK_TRANSFER_COMPLETED = 'customer_bank_transfer_completed',
    //  A transfer was created for a Customer. Represents funds transferring from a verified Customer’s balance or unverified Customer’s bank.
    CUSTOMER_TRANSFER_CREATED = 'customer_transfer_created',
    // A pending transfer has been cancelled, and will not process further.
    // Represents a cancellation of funds transferring either to an unverified Customer’s bank or to a verified Customer’s balance
    CUSTOMER_TRANSFER_CANCELLED = 'customer_transfer_cancelled',
    // A Customer transfer failed. Represents a failed funds transfer either to an unverified Customer’s bank or to a verified Customer’s balance.
    CUSTOMER_TRANSFER_FAILED = 'customer_transfer_failed',
    // A Customer transfer was successful. Represents a successful funds transfer either to an unverified
    // Customer’s bank or to a verified Customer’s balance.
    CUSTOMER_TRANSFER_COMPLETED = 'customer_transfer_completed'
}
