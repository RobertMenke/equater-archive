import { UniqueVendorAssociation } from '../../transaction/unique-vendor-association.entity'
import { UniqueVendor } from '../../transaction/unique-vendor.entity'

export class VendorAssociationEvent {
    constructor(
        public readonly association: UniqueVendorAssociation,
        public readonly uniqueVendor: UniqueVendor,
        public readonly associatedUniqueVendor: UniqueVendor
    ) {}
}
