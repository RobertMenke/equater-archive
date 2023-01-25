import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { ExpenseContribution } from '../shared_expense/shared-expense.dto'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { SharedExpenseService, UserAgreementStory } from '../shared_expense/shared-expense.service'
import { BinaryStatus, mapAsync, mapAsyncSequential } from '../utils/data.utils'
import { RelationshipService } from './relationship.service'
import { UserInvite } from './user-invite.entity'
import { User } from './user.entity'

@Injectable()
export class UserInviteService implements DeletesManagedResources {
    constructor(
        @InjectRepository(UserInvite)
        private readonly repository: Repository<UserInvite>,
        private readonly sharedExpenseService: SharedExpenseService,
        private readonly relationshipService: RelationshipService
    ) {}

    findWhere(conditions: FindOptionsWhere<UserInvite>): Promise<UserInvite[]> {
        return this.repository.find({
            where: conditions
        })
    }

    async deleteManagedResourcesForUser(user: User): Promise<void> {
        await this.repository.delete({
            initiatingUserId: user.id
        })
    }

    createUserInvite(email: string, sharedExpense: SharedExpense, dto: ExpenseContribution) {
        const entity = new UserInvite({
            email: email.toLowerCase(),
            initiatingUserId: sharedExpense.expenseOwnerUserId,
            sharedExpenseId: sharedExpense.id,
            contributionType: dto.contributionType,
            contributionValue: dto.contributionValue
        })

        return this.repository.save(entity)
    }

    /**
     * During registration, if I have any outstanding expense sharing agreement invitations
     * convert those into pending shared expense user agreements.
     *
     *
     * @param user
     * @param invites
     */
    async handleConversionToUser(user: User, invites: UserInvite[]): Promise<UserAgreementStory[]> {
        const invitations = await mapAsyncSequential(invites, async (invite) => {
            invite.isConverted = true
            invite.dateTimeBecameUser = new Date()
            return await this.repository.save(invite)
        })

        const agreements = await mapAsync(invitations, (invite) =>
            this.sharedExpenseService.convertUserInviteToAgreement(user, invite)
        )

        // Create confirmed relationships between those that invited the user and the new user
        await mapAsync(invitations, async (invite) => {
            const initiatingUser = await invite.initiatingUser

            return await this.relationshipService.setRelationshipStatus(initiatingUser, user, BinaryStatus.IS_ACTIVE)
        })

        return await mapAsync(agreements, (agreement) => this.sharedExpenseService.getUserAgreementStory(agreement))
    }

    getInviteByUuid(uuid: string): Promise<UserInvite | null> {
        return this.repository.findOne({
            where: {
                uuid: uuid
            }
        })
    }

    getInviteByEmail(email: string): Promise<UserInvite[]> {
        return this.repository.find({
            where: {
                email: email
            }
        })
    }

    getInviteByExpenseSharingAgreement(expense: SharedExpense): Promise<UserInvite[]> {
        return this.repository.find({
            where: {
                sharedExpenseId: expense.id
            }
        })
    }

    getPendingInvitesByExpenseSharingAgreement(expense: SharedExpense): Promise<UserInvite[]> {
        return this.repository.find({
            where: {
                sharedExpenseId: expense.id,
                isConverted: false
            }
        })
    }
}
