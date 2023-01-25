import { User } from '../user/user.entity'

export class AccountDeletionEvent {
    constructor(public readonly user: User) {}
}
