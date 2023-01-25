import { User } from '../user/user.entity'

export interface DeletesManagedResources {
    deleteManagedResourcesForUser(user: User): Promise<void>
}
