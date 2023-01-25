import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { S3 } from 'aws-sdk'
import { instanceToPlain } from 'class-transformer'
import { readFile } from 'fs'
import { join } from 'path'
import { Transaction as PlaidTransaction } from 'plaid'
import { firstValueFrom } from 'rxjs'
import * as sharp from 'sharp'
import { Brackets, FindOptionsWhere, FindManyOptions, QueryFailedError, Repository } from 'typeorm'
import { promisify } from 'util'
import { PoorMansPagerDutyService } from '../alerting/poor-mans-pager-duty.service'
import { S3Service } from '../aws/s3.service'
import { ConfigService, Environment } from '../config/config.service'
import { TransactionsUpdateEvent } from '../expense_api/events/transactions-update.event'
import { VendorAssociationEvent } from '../expense_api/events/vendor-association.event'
import { TRANSACTION_TO_REVIEW_EVENING, TRANSACTION_TO_REVIEW_MORNING } from '../expense_api/expense-api.constants'
import { SharedExpenseTransaction } from '../shared_expense/shared-expense-transaction.entity'
import { SharedExpense } from '../shared_expense/shared-expense.entity'
import { logError, mapAsync, removeDuplicates } from '../utils/data.utils'
import { LogoFetchService } from './logo-fetch.service'
import { Transaction } from './transaction.entity'
import { TransactionService } from './transaction.service'
import { UniqueVendorAssociation } from './unique-vendor-association.entity'
import { UniqueVendor } from './unique-vendor.entity'
import { VendorTransactionName } from './vendor-transaction-name.entity'
import { VENDORS_PER_PAGE } from './vendor.constants'
import { AssociateVendorDto, CreateVendorDto, CreateVendorFromPlaceDto, PatchVendorDto } from './vendor.dto'
import { v4 as uuid } from 'uuid'
import { get } from 'fast-levenshtein'

const readFileAsync = promisify(readFile)

@Injectable()
export class VendorService {
    private readonly logger = new Logger(VendorService.name)
    static PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX = 'pre-processing'
    static POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX = 'post-processing'
    static LOGO_WIDTH = 200
    static LOGO_HEIGHT = 200

    constructor(
        @InjectRepository(UniqueVendor)
        private readonly uniqueVendorRepository: Repository<UniqueVendor>,
        @InjectRepository(VendorTransactionName)
        private readonly vendorTransactionNameRepository: Repository<VendorTransactionName>,
        @InjectRepository(UniqueVendorAssociation)
        private readonly vendorAssociationRepository: Repository<UniqueVendorAssociation>,
        private readonly transactionService: TransactionService,
        private readonly s3Service: S3Service,
        private readonly configService: ConfigService,
        private readonly logoFetchService: LogoFetchService,
        private readonly eventBus: EventBus,
        private readonly alertService: PoorMansPagerDutyService
    ) {}

    findUniqueVendorBy(options: FindOptionsWhere<UniqueVendor>): Promise<UniqueVendor> {
        return this.uniqueVendorRepository.findOne({
            where: options
        })
    }

    findUniqueVendorsBy(
        options: FindOptionsWhere<UniqueVendor>,
        additionalOptions: Partial<FindManyOptions<UniqueVendor>> = {}
    ): Promise<UniqueVendor[]> {
        return this.uniqueVendorRepository.find({
            ...additionalOptions,
            where: options
        })
    }

    findVendorTransactionNameBy(options: FindOptionsWhere<VendorTransactionName>): Promise<VendorTransactionName> {
        return this.vendorTransactionNameRepository.findOne({
            where: options
        })
    }

    findVendorTransactionNamesBy(options: FindOptionsWhere<VendorTransactionName>): Promise<VendorTransactionName[]> {
        return this.vendorTransactionNameRepository.find({
            where: options
        })
    }

    /**
     * Retrieve all unique vendors
     */
    getUniqueVendors() {
        return this.uniqueVendorRepository.find({
            order: {
                totalNumberOfExpenseSharingAgreements: 'ASC'
            }
        })
    }

    /**
     * 1) Search for unique vendors by PPD_ID
     * 2) Next, search the vendor_transaction_name table. This table always preserves
     *    the name that was used for the original transaction even if we later chose to
     *    rename the unique_vendor friendlyName later in ops.
     * 3) If vendor transaction name is found in step 2, use it to look up the unique vendor
     * 4) If it's not found create both a vendor transaction name and a unique vendor and mark the unique vendor as requiring review
     *
     * @param transaction
     */
    async findOrCreateUniqueVendor(transaction: PlaidTransaction): Promise<UniqueVendor> {
        if (transaction.payment_meta.ppd_id) {
            const vendor = await this.findUniqueVendorBy({ ppdId: transaction.payment_meta.ppd_id })
            if (vendor) {
                return vendor
            }
        }

        const vendorTransactionName = await this.findVendorTransactionNameFromPlaidTransaction(transaction)

        if (vendorTransactionName) {
            return await this.findUniqueVendorBy({ id: vendorTransactionName.uniqueVendorId })
        }

        try {
            const uniqueVendor = await this.addUniqueVendor(transaction)
            await this.addVendorTransactionName(uniqueVendor, transaction)

            return uniqueVendor
        } catch (e) {
            // Due to a race condition (since we process these inside of a Promise.all)
            // it's possible that we run into duplicate inserts. Try to handle this
            // gracefully here so that we still capture the transaction.
            logError(this.logger, e)

            const vendorTransactionName = await this.findVendorTransactionNameFromPlaidTransaction(transaction)

            if (vendorTransactionName) {
                return await this.findUniqueVendorBy({ id: vendorTransactionName.uniqueVendorId })
            }

            throw e
        }
    }

    /**
     * In this case we encountered a vendor we hadn't seen before and marked it as "Requires Internal Review".
     * Upon review, we decided that this vendor is already in our list of unique vendors and we decided to associate
     * the transaction with the existing unique vendor.
     *
     * @param vendorUnderReview
     * @param existingVendor
     */
    async assignToExistingVendor(vendorUnderReview: UniqueVendor, existingVendor: UniqueVendor): Promise<UniqueVendor> {
        let existingVendorNames = await this.findVendorTransactionNamesBy({ uniqueVendorId: vendorUnderReview.id })
        existingVendorNames = existingVendorNames.map((vendorName) => {
            vendorName.uniqueVendorId = existingVendor.id
            return vendorName
        })

        const transactionWithVendorUnderReview = await this.transactionService.findManyTransactionsBy({
            uniqueVendorId: vendorUnderReview.id
        })
        await this.transactionService.associateTransactionsWithAnotherVendor(vendorUnderReview, existingVendor)
        // If the vendor under review had not yet been reviewed, make sure any transactions for the vendor are now
        // processed as if they'd come in from the existing vendor.
        // Scenario:
        //     - I set up a shared bill for my apartment (which we already have in our db)
        //     - My apartment charges me, but we fail to match the vendor name based on our existing entry
        //     - We then review the transaction and associate this transaction with my apartment
        //     - The expected behavior for the user would be that this charge gets processed
        if (!vendorUnderReview.hasBeenReviewedInternally) {
            const transactionsToProcess = await this.transactionService.findByIds(
                transactionWithVendorUnderReview.map((transaction) => transaction.id)
            )
            await this.processNewlyAssociatedTransactions(transactionsToProcess)
        }

        await this.vendorTransactionNameRepository.save(existingVendorNames)
        await this.uniqueVendorRepository.delete({
            id: vendorUnderReview.id
        })

        return existingVendor
    }

    /**
     * If the vendor under review had not yet been reviewed, make sure any transactions for the vendor are now
     * processed as if they'd come in from the existing vendor.
     * Scenario:
     *     - I set up a shared expense for my apartment (which we already have in our db)
     *     - My apartment charges me, but we fail to match the vendor name based on our existing entry
     *     - We then review the transaction and associate this transaction with my apartment
     *     - The expected behavior for the user would be that this charge gets processed
     *
     * @param transactions
     */
    async processNewlyAssociatedTransactions(transactions: Transaction[]) {
        for (const transaction of transactions) {
            const account = await transaction.account

            // If this account has not been explicitly linked with Plaid, don't process the transaction
            if (!account.isActive) {
                continue
            }

            const user = await account.user
            this.eventBus.publish(new TransactionsUpdateEvent(user, account, [transaction]))
        }
    }

    /**
     *
     * @param offset
     */
    listVendors(offset: number): Promise<[UniqueVendor[], number]> {
        return this.uniqueVendorRepository.findAndCount({
            skip: offset,
            take: VENDORS_PER_PAGE,
            where: {
                hasBeenReviewedInternally: true,
                vendorIdentityCannotBeDetermined: false
            },
            order: {
                friendlyName: 'ASC'
            }
        })
    }

    /**
     * We want to greet users with our most popular selections first
     *
     * @param limit
     */
    listPopularVendors(limit: number = 50): Promise<UniqueVendor[]> {
        return this.uniqueVendorRepository.find({
            where: {
                hasBeenReviewedInternally: true,
                vendorIdentityCannotBeDetermined: false
            },
            order: {
                totalNumberOfExpenseSharingAgreements: 'DESC'
            },
            take: limit
        })
    }

    searchVendors(searchTerm: string, hasBeenReviewInternally: boolean): Promise<UniqueVendor[]> {
        const qb = this.uniqueVendorRepository.createQueryBuilder()

        qb.where('vendorIdentityCannotBeDetermined = :vendorIdentityCannotBeDetermined', {
            vendorIdentityCannotBeDetermined: false
        })

        qb.andWhere('hasBeenReviewedInternally = :hasBeenReviewedInternally', {
            hasBeenReviewedInternally: hasBeenReviewInternally
        })

        qb.andWhere(
            new Brackets((qb) => {
                qb.orWhere('friendlyName like :friendlyName', {
                    friendlyName: `%${searchTerm}%`
                })

                qb.orWhere('ppdId like :ppdId', {
                    ppdId: `%${searchTerm}%`
                })
            })
        )

        qb.addOrderBy(`
            CASE
                WHEN ppdId LIKE "%${searchTerm}" THEN 1
                WHEN friendlyName LIKE "%${searchTerm}" THEN 2
                WHEN friendlyName LIKE "${searchTerm}%" THEN 3
                WHEN friendlyName LIKE "%${searchTerm}%" THEN 4
                ELSE 3
            END
        `)

        qb.limit(50)

        return qb.getMany()
    }

    /**
     * Note: This probably should be named totalNumberOfSharedBillArrangements
     *
     * @param vendor
     */
    incrementTotalAgreements(vendor: UniqueVendor): Promise<UniqueVendor> {
        vendor.totalNumberOfExpenseSharingAgreements = vendor.totalNumberOfExpenseSharingAgreements + 1

        return this.uniqueVendorRepository.save(vendor)
    }

    async patchUniqueVendor(vendor: UniqueVendor, dto: PatchVendorDto): Promise<UniqueVendor> {
        vendor.friendlyName = dto.friendlyName
        vendor.hasBeenReviewedInternally = true
        vendor.ppdId = typeof dto.ppdId === 'string' && dto.ppdId.trim().length > 0 ? dto.ppdId : null
        vendor.dateTimeModified = new Date()
        vendor.vendorIdentityCannotBeDetermined = dto.vendorIdentityCannotBeDetermined

        if (dto.preProcessedLogoWasUploaded) {
            await this.processVendorLogo(vendor)
            vendor.logoUploadCompleted = true
            vendor.logoS3Bucket = this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
            vendor.logoS3Key = vendor.uuid
            vendor.logoSha256Hash = await this.hashLogo(vendor)
        }

        return await this.uniqueVendorRepository.save(vendor)
    }

    createPreSignedUploadUrlForVendorLogo(vendor: UniqueVendor): Promise<string> {
        return this.s3Service.createPreSignedUploadUrl({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
        })
    }

    createPreSignedDownloadUrlForVendorLogo(vendor: UniqueVendor): Promise<string> {
        return this.s3Service.createPreSignedDownloadUrl({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
        })
    }

    /**
     * This is used primarily when adding a new vendor to the database from ops ad-hoc
     *
     * @param vendorName
     */
    async attemptAutomaticLogoUploadFromUnknownVendor(vendorName: string): Promise<TemporaryLogoUploadResponse> {
        const readStream = await firstValueFrom(this.logoFetchService.findLogoForCompanyName(vendorName))
        const uniqueId = uuid()
        await this.s3Service.createWriteStream({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${uniqueId}`,
            Body: readStream
        })

        const preSignedUrl = await this.s3Service.createPreSignedDownloadUrl({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${uniqueId}`
        })

        return {
            preSignedUrl,
            uuid: uniqueId,
            bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            key: `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${uniqueId}`
        }
    }

    async serializeVendor(uniqueVendor: UniqueVendor) {
        if (!uniqueVendor.logoUploadCompleted) {
            return uniqueVendor
        }

        uniqueVendor.logoUrl = await this.createPreSignedDownloadUrlForVendorLogo(uniqueVendor)

        return uniqueVendor
    }

    async makeUniqueVendorAssociation(
        vendorId: number,
        associatedVendorId: number,
        dto: AssociateVendorDto
    ): Promise<UniqueVendorAssociation> {
        const vendor = await this.findUniqueVendorBy({ id: vendorId })
        const associatedVendor = await this.findUniqueVendorBy({ id: associatedVendorId })

        if (!vendor) {
            throw new NotFoundException(`No vendor found for ${vendorId}`)
        }

        if (!associatedVendor) {
            throw new NotFoundException(`No vendor found for ${associatedVendorId}`)
        }

        const existingAssociation = await this.findExistingAssociation(vendorId, associatedVendorId)

        if (existingAssociation) {
            existingAssociation.associationType = dto.associationType
            existingAssociation.notes = dto.notes

            return this.vendorAssociationRepository.save(existingAssociation)
        }

        let entity = new UniqueVendorAssociation({
            uniqueVendorId: vendorId,
            associatedUniqueVendorId: associatedVendorId,
            associationType: dto.associationType,
            notes: dto.notes
        })

        entity = await this.vendorAssociationRepository.save(entity)

        /**
         * Figure out if we need to retroactively settle up
         *
         * @see VendorAssociationHandler
         */
        this.eventBus.publish(new VendorAssociationEvent(entity, vendor, associatedVendor))

        return entity
    }

    /**
     * @param associationId
     */
    async removeAssociation(associationId: number) {
        const association = await this.vendorAssociationRepository.findOne({ where: { id: associationId } })

        if (!association) {
            throw new NotFoundException()
        }

        await this.vendorAssociationRepository.remove(association)
    }

    findAllAssociations(vendorId: number): Promise<UniqueVendorAssociation[]> {
        const qb = this.vendorAssociationRepository.createQueryBuilder('qb')

        qb.where('uniqueVendorId = :id', {
            id: vendorId
        })

        qb.orWhere('associatedUniqueVendorId = :associatedVendorId', {
            associatedVendorId: vendorId
        })

        return qb.getMany()
    }

    /**
     * Grab the relevant [Vendor] instances for the front-end
     *
     * @param associations
     */
    async serializeUniqueVendorAssociations(associations: UniqueVendorAssociation[]) {
        const lookupTable = new Map<number, UniqueVendor>()

        return await mapAsync(associations, async (association) => {
            let vendor = lookupTable.get(association.uniqueVendorId)

            if (!vendor) {
                vendor = await association.uniqueVendor
                lookupTable.set(association.uniqueVendorId, vendor)
            }

            let associatedVendor = lookupTable.get(association.associatedUniqueVendorId)

            if (!associatedVendor) {
                associatedVendor = await association.associatedUniqueVendor
                lookupTable.set(association.associatedUniqueVendorId, associatedVendor)
            }

            return {
                association: instanceToPlain(association, { excludePrefixes: ['__'] }),
                vendor: await this.serializeVendor(vendor),
                associatedVendor: await this.serializeVendor(associatedVendor)
            }
        })
    }

    /**
     * Note: The inverse of this query is trickier. If you left join and search for IS NULL it will find
     * any shared_expense where there isn't a transaction.
     *
     * @param vendorIds
     */
    getVendorsFromListThatHaveBeenMatchedInSharedBillingTransactions(vendorIds: number[]): Promise<UniqueVendor[]> {
        if (vendorIds.length === 0) {
            return Promise.resolve([])
        }

        const qb = this.uniqueVendorRepository.createQueryBuilder('vendor')
        qb.innerJoin(SharedExpense, 'shared_expense', 'shared_expense.uniqueVendorId = vendor.id')
        qb.leftJoin(
            SharedExpenseTransaction,
            'shared_expense_transaction',
            'shared_expense.id = shared_expense_transaction.sharedExpenseId'
        )
        qb.whereInIds(vendorIds)
        qb.andWhere('shared_expense_transaction.id IS NOT NULL')

        return qb.getMany()
    }

    private findExistingAssociation(
        vendorId: number,
        associatedVendorId: number
    ): Promise<UniqueVendorAssociation | null> {
        const qb = this.vendorAssociationRepository.createQueryBuilder('qb')

        qb.where('uniqueVendorId = :id AND associatedUniqueVendorId = :associatedId', {
            id: vendorId,
            associatedId: associatedVendorId
        })

        qb.orWhere('uniqueVendorId = :vendorId AND associatedUniqueVendorId = :associatedVendorId', {
            vendorId: associatedVendorId,
            associatedVendorId: vendorId
        })

        return qb.getOne()
    }

    /**
     * This is a common task when parsing transactions. New transactions come in and our job
     * is to figure out if any of those transactions belong to a shared bill.
     *
     * We need to make sure that given a list of vendors we're also taking into account
     * vendor associations.
     *
     * @param vendors
     */
    async createVendorIdListIncludingAssociations(vendors: number[]): Promise<number[]> {
        const associations = await mapAsync(vendors, (vendor) => this.findAssociatedVendors(vendor))
        const allVendors = []

        for (const association of associations.flat()) {
            allVendors.push(association.uniqueVendorId)
            allVendors.push(association.associatedUniqueVendorId)
        }

        return removeDuplicates(vendors.concat(allVendors))
    }

    private findAssociatedVendors(uniqueVendorId: number): Promise<UniqueVendorAssociation[]> {
        const qb = this.vendorAssociationRepository.createQueryBuilder('qb')

        qb.where('uniqueVendorId = :uniqueVendorId', {
            uniqueVendorId: uniqueVendorId
        })

        qb.orWhere('associatedUniqueVendorId = :associatedUniqueVendorId', {
            associatedUniqueVendorId: uniqueVendorId
        })

        return qb.getMany()
    }

    /**
     * Not attempting to automatically fetch a logo in this case because
     * we're relying on an employee uploading a logo manually on ops
     *
     * @param dto
     */
    createUniqueVendorFromOps(dto: CreateVendorDto): Promise<UniqueVendor> {
        const entity = new UniqueVendor({
            friendlyName: dto.friendlyName,
            dateTimeAdded: new Date(),
            uuid: dto.uuid,
            hasBeenReviewedInternally: true
        })

        return this.uniqueVendorRepository.save(entity)
    }

    /**
     * Not attempting to automatically fetch a logo here because we can't trust our
     * automated fetching process to display something respectable to a user
     *
     * @param dto
     */
    createUniqueVendorFromGooglePlaces(dto: CreateVendorFromPlaceDto): Promise<UniqueVendor> {
        const entity = new UniqueVendor({
            friendlyName: dto.primaryText,
            dateTimeAdded: new Date(),
            hasBeenReviewedInternally: false,
            googlePlacesId: dto.placeId
        })

        return this.uniqueVendorRepository.save(entity)
    }

    /**
     * If we come across a transaction from a vendor that we don't recognize we first add
     * a unique vendor that will require manual review from our team in order to verify
     * the company name, logo, and PPD_ID.
     *
     * @param transaction
     */
    private async addUniqueVendor(transaction: PlaidTransaction): Promise<UniqueVendor> {
        if (!transaction.merchant_name && !transaction.name) {
            throw new Error(`Transaction has no vendor name`)
        }

        try {
            const entity = new UniqueVendor({
                friendlyName: transaction.merchant_name || transaction.name,
                dateTimeAdded: new Date(),
                ppdId: transaction.payment_meta.ppd_id
            })

            const vendor = await this.uniqueVendorRepository.save(entity)

            return await this.attemptAutomaticVendorLogoFetch(transaction, vendor)
        } catch (e) {
            // This is a bit of a hack. We want to parse transactions quickly, so we parse them
            // in parallel, however, 1 consequence of this approach is a race condition where 2 unique
            // vendors can be attempted to be inserted simultaneously and produce this ER_DUP_ENTRY
            // error. For now, it should be sufficient to catch the error and re-run the find method.
            // @ts-ignore
            if (e instanceof QueryFailedError && e.code === 'ER_DUP_ENTRY') {
                if (transaction.payment_meta.ppd_id) {
                    return await this.findUniqueVendorBy({ ppdId: transaction.payment_meta.ppd_id })
                }

                return await this.findUniqueVendorBy({ friendlyName: transaction.merchant_name || transaction.name })
            }

            throw e
        }
    }

    /**
     *
     * @param uniqueVendor
     * @param transaction
     */
    private async addVendorTransactionName(
        uniqueVendor: UniqueVendor,
        transaction: PlaidTransaction
    ): Promise<VendorTransactionName> {
        if (!transaction.name) {
            throw new Error(`Transaction has no vendor name`)
        }

        try {
            const entity = new VendorTransactionName({
                uniqueVendorId: uniqueVendor.id,
                transactionName: transaction.name,
                merchantName: transaction.merchant_name,
                ppdId: transaction.payment_meta.ppd_id
            })

            return await this.vendorTransactionNameRepository.save(entity)
        } catch (e) {
            if (e.code !== `ER_DUP_ENTRY`) {
                this.logger.error(`Error creating VendorTransactionName for ${transaction.name} Error: ${e.message}`)
            }

            return await this.findVendorTransactionNameBy({ transactionName: transaction.name })
        }
    }

    /**
     * When we process a new vendor, we attempt to automatically retrieve the logo using
     * services like Clearbit and Brandfetch. The idea is to save us time. Even if only
     * 50% of these are acceptable for our use case it would save us tons of time.
     *
     * @param transaction
     * @param vendor
     * @private
     */
    private async attemptAutomaticVendorLogoFetch(transaction: PlaidTransaction, vendor: UniqueVendor) {
        if (!transaction.merchant_name) {
            return vendor
        }

        try {
            const readStream = await firstValueFrom(
                this.logoFetchService.findLogoForCompanyName(transaction.merchant_name)
            )
            await this.s3Service.createWriteStream({
                Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
                Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`,
                Body: readStream
            })
            await this.processVendorLogo(vendor)

            vendor.logoUploadCompleted = true
            vendor.logoS3Bucket = this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET)
            vendor.logoS3Key = vendor.uuid
            vendor.logoSha256Hash = await this.hashLogo(vendor)

            return await this.uniqueVendorRepository.save(vendor)
        } catch (e) {
            this.logger.error(`Error automatically fetching logo ${e.message}`)
            return vendor
        }
    }

    /**
     * Resize the logo so that it's well optimized for display
     *
     * @param vendor
     */
    private async processVendorLogo(vendor: UniqueVendor): Promise<S3.ManagedUpload.SendData> {
        const readStream = this.s3Service.createReadStream({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
        })

        const resizeImage = sharp()
            .resize({
                width: VendorService.LOGO_WIDTH,
                height: VendorService.LOGO_HEIGHT,
                fit: 'contain',
                background: {
                    r: 0,
                    g: 0,
                    b: 0,
                    alpha: 0
                }
            })
            .composite([{ input: await this.getCircleOverlay(), gravity: 'center', blend: 'dest-in' }])

        const resizeStream = readStream.pipe(resizeImage)

        const upload = await this.s3Service.createWriteStream({
            Body: resizeStream,
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
        })

        await this.s3Service.deleteObject({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.PRE_PROCESSING_LOGO_UPLOAD_KEY_PREFIX}/${vendor.uuid}`
        })

        return upload
    }

    private getCircleOverlay(): Promise<Buffer> {
        const path = join(__dirname, '../../public/images/black_circle_for_img_composite.png')

        return readFileAsync(path)
    }

    private async findVendorTransactionNameFromPlaidTransaction(
        plaidTransaction: PlaidTransaction
    ): Promise<VendorTransactionName | null> {
        const transactionName = await this.findVendorTransactionNameBy({ transactionName: plaidTransaction.name })

        // If we matched the transaction name exactly, that's the best, highest accuracy match
        if (transactionName) {
            return transactionName
        }

        // Next, if there's no merchant name we just return undefined. We need to review this vendor.
        const merchantName = plaidTransaction.merchant_name

        if (!merchantName) {
            return null
        }

        // Merchant names aren't necessarily unique (but most often are).
        // For example, Camden Central apartments reports their merchant name as "Central".
        // In this case, find all the possible associated merchant names and match based on the
        // lowest levenshtein distance from the associated transaction name. This is likely to provide a high
        // accuracy match, though there certainly can be edge cases.
        const transactionNames = await this.findVendorTransactionNamesBy({ merchantName })

        if (transactionNames.length === 0) {
            return null
        }

        if (transactionNames.length === 1) {
            return transactionNames[0]
        }

        // Given that we matched many vendors by merchant name, match based on the lowest
        // levenshtein distance relative to the transaction name.
        let matchedVendor = transactionNames[0]
        let lowestDistance = get(plaidTransaction.name, matchedVendor.transactionName)

        for (const vendor of transactionNames) {
            const distance = get(plaidTransaction.name, vendor.transactionName)
            if (distance < lowestDistance) {
                lowestDistance = distance
                matchedVendor = vendor
            }
        }

        return matchedVendor
    }

    @Cron(`5 ${TRANSACTION_TO_REVIEW_MORNING} * * *`)
    sendTransactionsToReviewMorningAlert() {
        if (!this.configService.isProduction()) {
            return
        }

        this.sendTransactionsToReviewAlert().catch(this.logger.error)
    }

    @Cron(`5 ${TRANSACTION_TO_REVIEW_EVENING} * * *`)
    sendTransactionsToReviewEveningAlert() {
        if (!this.configService.isProduction()) {
            return
        }

        this.sendTransactionsToReviewAlert().catch(this.logger.error)
    }

    private async sendTransactionsToReviewAlert() {
        const vendors = await this.findUniqueVendorsBy(
            { hasBeenReviewedInternally: false },
            {
                order: {
                    dateTimeAdded: 'DESC'
                }
            }
        )

        const count = vendors.length

        if (count === 1) {
            await this.alertService.sendAlert(
                `${count} transaction requires your review. https://equater.app/dashboard/vendors`
            )
        } else {
            await this.alertService.sendAlert(
                `${count} transactions require your review. https://equater.app/dashboard/vendors`
            )
        }
    }

    private hashLogo(vendor: UniqueVendor) {
        if (!vendor.logoUploadCompleted || !vendor.logoS3Key) {
            return Promise.resolve(null)
        }

        return this.s3Service.hashFile({
            Bucket: this.configService.get(Environment.VENDOR_ASSETS_S3_BUCKET),
            Key: `${VendorService.POST_PROCESSING_LOG_UPLOAD_KEY_PREFIX}/${vendor.logoS3Key}`
        })
    }
}

export interface TemporaryLogoUploadResponse {
    preSignedUrl: string
    uuid: string
    key: string
    bucket: string
}
