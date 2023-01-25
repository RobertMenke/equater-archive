import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PlaidCategoryService } from '../plaid_category/plaid-category.service'
import { PlaidService } from './plaid.service'

@Injectable()
export class PlaidCronService {
    constructor(
        private readonly plaidService: PlaidService,
        private readonly plaidCategoryService: PlaidCategoryService
    ) {}

    @Cron('0 5 * * *')
    async syncCategories() {
        const categories = await this.plaidService.getCategories()
        return await this.plaidCategoryService.syncCategories(categories)
    }
}
