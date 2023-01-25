import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PlaidCategoryDescription } from './plaid-category-description.entity'
import { PlaidCategoryHierarchy } from './plaid-category-hierarchy.entity'
import { PlaidCategory } from './plaid-category.entity'
import { PlaidCategoryService } from './plaid-category.service'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([PlaidCategory, PlaidCategoryHierarchy, PlaidCategoryDescription])],
    providers: [PlaidCategoryService],
    exports: [PlaidCategoryService]
})
export class PlaidCategoryModule {}
