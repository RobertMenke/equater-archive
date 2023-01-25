import { User } from '../../user/user.entity'

export class TransactionUpdateEvent {
    constructor(
        public readonly relevantUsers: User[],
        // Serialized version of TransactionStory
        public readonly serializedTransactionStory: object
    ) {}
}
