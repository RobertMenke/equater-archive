import { User } from '../user.entity'

export class CreateRelationshipEvent {
    constructor(public readonly originatingUser: User, public readonly consentingUsers: User[]) {}
}
