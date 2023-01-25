import { BinaryStatus } from '../../utils/data.utils'
import { User } from '../user.entity'

export class ConfirmRelationshipEvent {
    constructor(
        public readonly originatingUser: User,
        public readonly consentingUsers: User[],
        public readonly status: BinaryStatus
    ) {}
}
