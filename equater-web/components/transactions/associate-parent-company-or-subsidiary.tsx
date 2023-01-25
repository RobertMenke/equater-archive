import { useState } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppColor } from '../../constants/colors'
import { AppDispatch, State } from '../../redux/config'
import {
    associateParentOrSubsidiary,
    setSelectedVendor,
    UniqueVendorAssociationType,
    Vendor
} from '../../redux/slices/transaction.slice'
import RadioGroupListWithDescription, { RadioOption } from '../input/RadioGroup'
import { Section } from '../layout/section'
import { Alert, AlertType } from '../tailwind-ui/feedback/alert'
import { VendorRow } from './vendor-row'
import { VendorSearch } from './vendor-search'

function createAssociationOptions(
    selectedVendor: Vendor | null = null,
    associatedVendor: Vendor | null = null
): RadioOption<UniqueVendorAssociationType>[] {
    return [
        {
            id: UniqueVendorAssociationType.PARENT_COMPANY,
            name: 'Parent Company',
            description: `${associatedVendor ? associatedVendor.friendlyName : ''} is the parent company of ${
                selectedVendor ? selectedVendor.friendlyName : ''
            }.`
        },
        {
            id: UniqueVendorAssociationType.SUBSIDIARY_COMPANY,
            name: 'Subsidiary',
            description: `${associatedVendor ? associatedVendor.friendlyName : ''} is a subsidiary of ${
                selectedVendor ? selectedVendor.friendlyName : ''
            }.`
        },
        {
            id: UniqueVendorAssociationType.OTHER,
            name: 'Other',
            description: "You're making an association between these 2 vendors for a different reason"
        }
    ]
}

export function AssociateParentCompanyOrSubsidiary() {
    const dispatch: AppDispatch = useDispatch()
    const { selectedVendor } = useSelector((state: State) => state.transaction)
    const [searchInput, setSearchInput] = useState('')
    const [vendorSearchResults, setVendorSearchResults] = useState<Vendor[]>([])
    const [alertIsShowing, setAlertIsShowing] = useState(false)
    const [existingVendor, setExistingVendor] = useState<Vendor | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [radioOptions, setRadioOptions] = useState(createAssociationOptions())
    const [selectedRadioOption, setSelectedRadioOption] = useState(createAssociationOptions()[0])
    const [notes, setNotes] = useState('')

    return (
        <Section
            title={'Add Parent Company Or Subsidiary'}
            subtitle={
                'Sometimes we want to associate a shared bill with multiple companies. For example, if my apartment is called "Icon Central" and the bill comes from the parent company, "TRG Management Group" we want a shared bill to be settled when either of those names appear on a bill.'
            }
        >
            <Alert
                visible={alertIsShowing}
                setIsVisible={setAlertIsShowing}
                onCancel={() => {
                    if (!isLoading) {
                        setAlertIsShowing(false)
                    }
                }}
                onConfirm={() => {
                    if (!isLoading && existingVendor && selectedVendor) {
                        setIsLoading(true)
                        console.log(selectedRadioOption)
                        dispatch(
                            associateParentOrSubsidiary(
                                selectedVendor,
                                existingVendor,
                                selectedRadioOption.id,
                                notes,
                                (vendor) => {
                                    setIsLoading(false)
                                    setAlertIsShowing(false)

                                    if (vendor) {
                                        dispatch(setSelectedVendor(vendor))
                                    }
                                }
                            )
                        )
                    }
                }}
                title={'Confirm your selection'}
                description={`Each of these options are functionally equivalent as far as the app is concerned, but help us better understand how these companies are related.`}
                alertType={AlertType.INFO}
                confirmationText={'Confirm'}
                isLoading={isLoading}
            >
                {existingVendor && selectedVendor && (
                    <div className={'my-6'}>
                        <RadioGroupListWithDescription
                            label={'Sample'}
                            options={radioOptions}
                            selected={selectedRadioOption}
                            setSelected={setSelectedRadioOption}
                        />

                        <NotesInput text={notes} setText={setNotes} />
                    </div>
                )}
            </Alert>
            <VendorSearch
                autoFocus={false}
                inputValue={searchInput}
                setInputValue={setSearchInput}
                showVendorsThatRequireInternalReview={false}
                background={AppColor.PRIMARY}
                onSearchResults={(vendors) => {
                    setVendorSearchResults(vendors)
                }}
            />
            {vendorSearchResults
                .filter((vendor) => !selectedVendor || vendor.id !== selectedVendor.id)
                .map((vendor) => (
                    <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        onRowClicked={(vendor) => {
                            setExistingVendor(vendor)
                            setAlertIsShowing(true)
                            const options = createAssociationOptions(selectedVendor, vendor)
                            setRadioOptions(options)
                            setSelectedRadioOption(options[0])
                        }}
                    />
                ))}
        </Section>
    )
}

interface NotesProps {
    text: string
    setText: (text: string) => void
}

// https://tailwindui.com/components/application-ui/forms/input-groups
function NotesInput(props: NotesProps) {
    return (
        <div className={'mt-4'}>
            <div className="flex justify-between">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                </label>
                <span className="text-sm text-gray-500" id="notes-optional">
                    Optional
                </span>
            </div>
            <div className="mt-1">
                <input
                    type="text"
                    name="notes"
                    id="vendor-association-notes"
                    className="shadow-sm bg-app-secondary-dark text-primary focus:ring-accent-primary block w-full sm:text-sm border-app-primary rounded-md"
                    placeholder="Anything worth noting..."
                    aria-describedby="notes-optional"
                    value={props.text}
                    onChange={(e) => props.setText(e.currentTarget.value)}
                />
            </div>
        </div>
    )
}
