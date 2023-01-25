import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { UniqueVendorAssociation, UniqueVendorAssociationType } from '../transaction/unique-vendor-association.entity'
import { UniqueVendor } from '../transaction/unique-vendor.entity'
import { VendorTransactionName } from '../transaction/vendor-transaction-name.entity'

@Injectable()
export class TransactionSeedService {
    constructor(
        @InjectRepository(UniqueVendor)
        private readonly vendorRepository: Repository<UniqueVendor>,
        @InjectRepository(VendorTransactionName)
        private readonly vendorNameRepository: Repository<VendorTransactionName>,
        @InjectRepository(UniqueVendorAssociation)
        private readonly vendorAssociationRepository: Repository<UniqueVendorAssociation>
    ) {}

    seedVendor(vendor: UniqueVendor) {
        return this.vendorRepository.save(vendor)
    }

    /**
     * During testing, always simulate a different uniqueVendor for a given VendorTransactionName
     *
     * @param vendor
     */
    seedVendorName(vendor: UniqueVendor) {
        const entity = new VendorTransactionName({
            uniqueVendorId: vendor.id,
            transactionName: uuid(),
            ppdId: vendor.ppdId
        })

        return this.vendorNameRepository.save(entity)
    }

    seedVendorAssociation(vendor: UniqueVendor, associatedVendor: UniqueVendor) {
        const entity = new UniqueVendorAssociation({
            uniqueVendorId: vendor.id,
            associatedUniqueVendorId: associatedVendor.id,
            associationType: UniqueVendorAssociationType.PARENT_COMPANY
        })

        return this.vendorAssociationRepository.save(entity)
    }
}
