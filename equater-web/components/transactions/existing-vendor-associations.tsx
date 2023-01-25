import { VendorAssociationResponse } from '../../redux/slices/transaction.slice'
import { Section } from '../layout/section'
import { VendorAssociationRow } from './vendor-association-row'

interface Props {
    associations: VendorAssociationResponse[]
}

export function ExistingVendorAssociations(props: Props) {
    return (
        <Section
            title={'Existing Parent/Subsidiary Relationships'}
            subtitle={'To edit an existing relationship use the "Add Parent Company Or Subsidiary" section'}
        >
            {props.associations.map((association) => (
                <VendorAssociationRow association={association} key={association.association.id} />
            ))}
        </Section>
    )
}
