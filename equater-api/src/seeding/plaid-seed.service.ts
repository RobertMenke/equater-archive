import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { createReadStream } from 'fs'
import { Transaction as PlaidTransaction } from 'plaid'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { PlaidLinkToken } from '../plaid/plaid-link-token.entity'
import { PlaidLinkTokenService } from '../plaid/plaid-link-token.service'
import { PlaidService } from '../plaid/plaid.service'
import { PlaidCategoryDescription } from '../plaid_category/plaid-category-description.entity'
import { PlaidCategoryHierarchy } from '../plaid_category/plaid-category-hierarchy.entity'
import { PlaidCategory } from '../plaid_category/plaid-category.entity'
import { Transaction } from '../transaction/transaction.entity'
import { TransactionService } from '../transaction/transaction.service'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorService } from '../transaction/vendor.service'
import { TransactionPullService } from '../transaction_pull/transaction-pull.service'
import { User } from '../user/user.entity'
import { PlaidInstitution } from '../user_account/plaid-institution.entity'
import { INSTITUTION_LOGO_PREFIX } from '../user_account/user-account.constants'
import { UserAccount } from '../user_account/user-account.entity'
import { SAMPLE_BRAND_ASSETS_DIRECTORY, SAMPLE_VENDOR_ICON } from './seeding.constants'

@Injectable()
export class PlaidSeedService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(UniqueVendor)
        private readonly uniqueVendorRepository: Repository<UniqueVendor>,
        @InjectRepository(PlaidCategory)
        private readonly plaidCategoryRepository: Repository<PlaidCategory>,
        @InjectRepository(PlaidCategoryDescription)
        private readonly plaidCategoryDescriptionRepository: Repository<PlaidCategoryDescription>,
        @InjectRepository(PlaidCategoryHierarchy)
        private readonly plaidCategoryHierarchyRepository: Repository<PlaidCategoryHierarchy>,
        @InjectRepository(PlaidInstitution)
        private readonly plaidInstitutionRepository: Repository<PlaidInstitution>,
        private readonly transactionPullService: TransactionPullService,
        private readonly transactionService: TransactionService,
        private readonly vendorService: VendorService,
        private readonly plaidService: PlaidService,
        private readonly configService: ConfigService,
        private readonly s3Service: S3Service,
        private readonly linkTokenService: PlaidLinkTokenService
    ) {}

    seedPlaidTransaction(
        account: UserAccount,
        transaction: PlaidTransaction,
        vendor: UniqueVendor
    ): Promise<Transaction> {
        return this.transactionPullService.createTransaction([account], transaction, vendor)
    }

    seedHistoricalTransactionPull(user: User): Promise<Transaction[]> {
        return this.transactionPullService.parseHistoricalTransactionPull(user)
    }

    async seedPlaidInstitution(id: string = uuid()) {
        const institution = await this.plaidService.getInstitution(id)
        const uniqueId = uuid()
        const readStream = createReadStream(`${SAMPLE_BRAND_ASSETS_DIRECTORY}/${SAMPLE_VENDOR_ICON}`)

        await this.s3Service.createWriteStream({
            Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            Key: `${INSTITUTION_LOGO_PREFIX}/${uniqueId}`,
            Body: readStream
        })

        const entity = new PlaidInstitution({
            uuid: uniqueId,
            institutionId: id,
            name: institution.name,
            websiteUrl: institution.url,
            primaryColorHexCode: institution.primary_color,
            logoS3Key: `${INSTITUTION_LOGO_PREFIX}/${uniqueId}`,
            logoS3Bucket: this.configService.get(Environment.S3_PHOTOS_BUCKET),
            usesOauthLoginFlow: institution.oauth
        })

        return await this.plaidInstitutionRepository.save(entity)
    }

    getVendors(): Promise<UniqueVendor[]> {
        return this.vendorService.getUniqueVendors()
    }

    async getLastVendor(): Promise<UniqueVendor> {
        const vendors = await this.vendorService.getUniqueVendors()

        return vendors[vendors.length - 1]
    }

    seedLinkTokens(user: User): Promise<PlaidLinkToken[]> {
        return this.linkTokenService.updatePlaidLinkTokenIfNecessary(user)
    }
}
