import { useState } from 'react'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppColor } from '../../constants/colors'
import { AppDispatch, State } from '../../redux/config'
import { setShowAddMerchantAlert } from '../../redux/slices/ops-navigation.slice'
import { PlusIcon } from '../icons/hero-icons/plus-icon'
import { SearchInput } from '../search/search-input'
import { ButtonRole, IconButton } from '../tailwind-ui/input/button'
import { ShortToggle } from '../tailwind-ui/input/short-toggle'
import {
    searchVendors,
    setShowVendorsThatRequireReview,
    setShouldShowNoResults,
    Vendor
} from '../../redux/slices/transaction.slice'

interface Props {
    autoFocus: boolean
    background?: AppColor
    showFilters?: boolean
    inputValue: string
    showVendorsThatRequireInternalReview: boolean
    setInputValue: (input: string) => void
    onSearchResults: (list: Vendor[]) => void | Promise<void>
    onIsLoading?: (isLoading: boolean) => void
}

export function VendorSearch(props: Props) {
    const dispatch: AppDispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(false)
    const { showVendorsThatRequireReview } = useSelector((state: State) => state.transaction)

    function setLoadingState(state: boolean) {
        setIsLoading(state)
        if (props.onIsLoading) {
            props.onIsLoading(state)
        }
    }

    return (
        <div className={'flex flex-col mt-2 mb-2 pt-4 pb-4'}>
            <SearchInput
                autoFocus={props.autoFocus}
                background={props.background}
                searchValue={props.inputValue}
                isLoading={isLoading}
                setSearchValue={props.setInputValue}
                placeholderText={'Search vendors by name or PPD ID'}
                onSearchInput={(value, cancelToken) => {
                    dispatch(setShouldShowNoResults(false))
                    if (value.trim().length === 0) {
                        props.onSearchResults([])
                        setLoadingState(false)
                        return
                    }

                    setLoadingState(true)
                    dispatch(
                        searchVendors(value, props.showVendorsThatRequireInternalReview, cancelToken.token, (list) => {
                            setLoadingState(false)
                            props.onSearchResults(list)
                        })
                    )
                }}
            />
            {props.showFilters && (
                <div className={'rounded flex flex-col mt-2'}>
                    <span className={'text-gray-400 ml-2 mt-1'}>Filters:</span>
                    <div className={'flex flex-row justify-between mx-0 md:mx-4'}>
                        <div className={'flex flex-row rounded mt-1 p-2'}>
                            <span className={'text-gray-500 text-sm mr-1 md:mr-2'}>Internal Review Required</span>
                            <ShortToggle
                                toggleValue={showVendorsThatRequireReview}
                                onToggle={(value: boolean) => {
                                    dispatch(setShowVendorsThatRequireReview(value))
                                }}
                            />
                        </div>
                        <div>
                            <IconButton
                                Icon={PlusIcon}
                                onClick={() => {
                                    dispatch(setShowAddMerchantAlert(true))
                                }}
                                text={'Add'}
                                isLoading={false}
                                style={{ paddingTop: '0.25rem', paddingBottom: '0.25rem' }}
                                buttonClassName={'py-1'}
                                role={ButtonRole.PRIMARY}
                                tooltipState={{
                                    description: 'Add a new vendor',
                                    keys: ['⌘', '⇧', 'C']
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
