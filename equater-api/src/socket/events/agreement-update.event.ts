import { User } from '../../user/user.entity'

export class AgreementUpdateEvent {
    constructor(
        public readonly relevantUsers: User[],
        // Should be the serialized version of SharedExpenseStory
        public readonly serializedStory: object
    ) {}
}
