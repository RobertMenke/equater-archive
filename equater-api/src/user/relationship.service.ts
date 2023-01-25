import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { DeletesManagedResources } from '../account_deletion/deletes-managed-resources.interface'
import { BinaryStatus, mapAsync, removeDuplicates } from '../utils/data.utils'
import { Relationship } from './relationship.entity'
import { User } from './user.entity'
import { UserSearchResult, UserService } from './user.service'

@Injectable()
export class RelationshipService implements DeletesManagedResources {
    constructor(
        @InjectRepository(Relationship)
        private readonly relationshipRepository: Repository<Relationship>,
        private readonly userService: UserService
    ) {}

    async deleteManagedResourcesForUser(user: User): Promise<void> {
        const qb = this.relationshipRepository.createQueryBuilder('qb')

        qb.where('originatingUserId = :originatingUserId', {
            originatingUserId: user.id
        })

        qb.orWhere('consentingUserId = :consentingUserId', {
            consentingUserId: user.id
        })

        await qb.delete().execute()
    }

    createRelationship(originatingUser: User, consentingUser: User): Promise<Relationship> {
        const entity = new Relationship({
            originatingUserId: originatingUser.id,
            consentingUserId: consentingUser.id,
            isConfirmed: false
        })

        return this.relationshipRepository.save(entity)
    }

    createRelationships(originatingUser: User, consentingUsers: User[]): Promise<Relationship[]> {
        return mapAsync(consentingUsers, async (consentingUser) => {
            const relationship = await this.findRelationship(originatingUser, consentingUser)

            if (relationship) {
                return relationship
            }

            return await this.createRelationship(originatingUser, consentingUser)
        })
    }

    async setRelationshipStatus(
        originatingUser: User,
        consentingUser: User,
        status: BinaryStatus
    ): Promise<Relationship> {
        let relationship = await this.findRelationship(originatingUser, consentingUser)
        relationship = relationship || (await this.createRelationship(originatingUser, consentingUser))

        relationship.isConfirmed = status === BinaryStatus.IS_ACTIVE
        relationship.dateTimeConfirmed = status === BinaryStatus.IS_ACTIVE ? new Date() : null

        return this.relationshipRepository.save(relationship)
    }

    /**
     * Find a relationship involving 2 users no matter which party is the originating/consenting user
     *
     * @param originatingUser
     * @param consentingUser
     */
    findRelationship(originatingUser: User, consentingUser: User): Promise<Relationship | null> {
        const qb = this.relationshipRepository.createQueryBuilder()
        qb.where(
            new Brackets((qb) => {
                qb.where('originatingUserId = :originatingUserId', {
                    originatingUserId: originatingUser.id
                })

                qb.andWhere('consentingUserId = :consentingUserId', {
                    consentingUserId: consentingUser.id
                })
            })
        )

        // Note: typeorm requires uniqueness across qb fields. Prefixing with _ here
        // to signify that this query is testing for the inverse of the originating/consenting relationship
        qb.orWhere(
            new Brackets((qb) => {
                qb.where('originatingUserId = :_originatingUserId', {
                    _originatingUserId: consentingUser.id
                })

                qb.andWhere('consentingUserId = :_consentingUserId', {
                    _consentingUserId: originatingUser.id
                })
            })
        )

        return qb.getOne()
    }

    findRelationships(user: User): Promise<Relationship[]> {
        const qb = this.relationshipRepository.createQueryBuilder()

        qb.andWhere(
            new Brackets((qb) => {
                qb.where('originatingUserId = :originatingUserId', {
                    originatingUserId: user.id
                })

                qb.orWhere('consentingUserId = :consentingUserId', {
                    consentingUserId: user.id
                })
            })
        )

        return qb.getMany()
    }

    /**
     * Note: imperative style to optimize for speed. We want these user searches to be as fast as physically possible (with node =P)
     *
     * @param authenticatedUser
     * @param relationships
     * @param foundUsers
     */
    async categorizeSearchResultsByRelationshipStatus(
        authenticatedUser: User,
        relationships: Relationship[],
        foundUsers: User[]
    ): Promise<UserSearchResult> {
        const map = this.createRelationshipMapping(authenticatedUser, relationships)
        const friends: Object[] = []
        const users: Object[] = []

        for (const user of foundUsers) {
            const serializedUser = await this.userService.serializeUser(user)
            if (map.has(user.id)) {
                friends.push(serializedUser)
            } else {
                users.push(serializedUser)
            }
        }

        return {
            friends,
            users
        }
    }

    /**
     * Creates a representation of a user's relationships optimized for lookup speed
     *
     * @param authenticatedUser
     * @param relationships
     */
    private createRelationshipMapping(authenticatedUser: User, relationships: Relationship[]): Map<number, number> {
        const userIds = relationships.map((relationship) =>
            relationship.originatingUserId === authenticatedUser.id
                ? relationship.consentingUserId
                : relationship.originatingUserId
        )

        const friends = removeDuplicates(userIds)
        const map = new Map<number, number>()

        for (const friend of friends) {
            map.set(friend, 1)
        }

        return map
    }
}
