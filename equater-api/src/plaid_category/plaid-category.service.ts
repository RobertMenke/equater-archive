import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CategoriesGetResponse, Category } from 'plaid'
import { FindOptionsWhere, Repository } from 'typeorm'
import { Transaction } from '../transaction/transaction.entity'
import { logError, mapAsyncSequential } from '../utils/data.utils'
import { PlaidCategoryDescription } from './plaid-category-description.entity'
import { PlaidCategoryHierarchy } from './plaid-category-hierarchy.entity'
import { PlaidCategory } from './plaid-category.entity'

export interface PlaidCategoryContext {
    categoryId: string
    categoryType: string
    description: string
}

@Injectable()
export class PlaidCategoryService {
    private readonly logger = new Logger(PlaidCategoryService.name)

    constructor(
        @InjectRepository(PlaidCategory)
        private readonly categoryRepository: Repository<PlaidCategory>,

        @InjectRepository(PlaidCategoryDescription)
        private readonly categoryDescriptionRepository: Repository<PlaidCategoryDescription>,

        @InjectRepository(PlaidCategoryHierarchy)
        private readonly categoryHierarchyRepository: Repository<PlaidCategoryHierarchy>
    ) {}

    findCategoryBy(conditions: FindOptionsWhere<PlaidCategory>): Promise<PlaidCategory> {
        return this.categoryRepository.findOne({
            where: conditions
        })
    }

    findCategoryDescriptionBy(
        conditions: FindOptionsWhere<PlaidCategoryDescription>
    ): Promise<PlaidCategoryDescription> {
        return this.categoryDescriptionRepository.findOne({
            where: conditions
        })
    }

    findCategoryHierarchyBy(conditions: FindOptionsWhere<PlaidCategoryHierarchy>): Promise<PlaidCategoryHierarchy> {
        return this.categoryHierarchyRepository.findOne({
            where: conditions
        })
    }

    async findCategoryContextForTransaction(transaction: Transaction): Promise<PlaidCategoryContext> {
        try {
            const category = await this.findCategoryBy({ categoryId: transaction.categoryId })
            const hierarchy = await this.findCategoryHierarchyBy({ plaidCategoryId: category.id })
            const description = await this.findCategoryDescriptionBy({
                id: hierarchy.plaidCategoryHierarchyDescriptionId
            })

            return {
                categoryId: category.categoryId,
                categoryType: category.type,
                description: description.name
            }
        } catch (e) {
            logError(this.logger, e)
            return {
                categoryId: 'N/A',
                categoryType: 'N/A',
                description: 'N/A'
            }
        }
    }

    /**
     * Ensure our database has an accurate representation of plaid expense
     * categories
     *
     * @param response
     */
    async syncCategories(response: CategoriesGetResponse) {
        const nestedCategories = await mapAsyncSequential(response.categories, async (category) => {
            const updatedCategory = await this.saveCategory(category)
            const updatedHierarchies = await mapAsyncSequential(category.hierarchy, (hierarchy: string) => {
                return this.saveCategoryDescription(hierarchy)
            })

            return await mapAsyncSequential(updatedHierarchies, (hierarchy: PlaidCategoryDescription) => {
                return this.saveCategoryHierarchy(updatedCategory, hierarchy)
            })
        })

        return nestedCategories.flat()
    }

    private async saveCategory(category: Category): Promise<PlaidCategory> {
        const existingCategory = await this.categoryRepository.findOne({
            where: {
                categoryId: category.category_id
            }
        })

        if (existingCategory) {
            return existingCategory
        }

        return await this.categoryRepository.save(
            new PlaidCategory({
                categoryId: category.category_id,
                type: category.group
            })
        )
    }

    private async saveCategoryDescription(categoryName: string): Promise<PlaidCategoryDescription> {
        const existingDescription = await this.categoryDescriptionRepository.findOne({
            where: {
                name: categoryName
            }
        })

        if (existingDescription) {
            return existingDescription
        }

        return await this.categoryDescriptionRepository.save(
            new PlaidCategoryDescription({
                name: categoryName
            })
        )
    }

    private async saveCategoryHierarchy(
        category: PlaidCategory,
        description: PlaidCategoryDescription
    ): Promise<PlaidCategoryHierarchy> {
        const existingHierarchy = await this.categoryHierarchyRepository.findOne({
            where: {
                plaidCategoryId: category.id,
                plaidCategoryHierarchyDescriptionId: description.id
            }
        })

        if (existingHierarchy) {
            return existingHierarchy
        }

        return await this.categoryHierarchyRepository.save(
            new PlaidCategoryHierarchy({
                plaidCategoryId: category.id,
                plaidCategoryHierarchyDescriptionId: description.id
            })
        )
    }
}
