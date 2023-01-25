import { User } from '../../user/user.entity'

export class EmailConfirmationEvent {
    constructor(public readonly user: User) {}
}
