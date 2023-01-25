import * as React from 'react'
import { Link } from 'react-router-dom'
import { SharedExpenseStory, UserAgreementStory } from '../../types/shared-expense'
import { formatDateVerbose } from '../../utils/date.utils'
import { ArrowRightBold } from '../icons/shape-so/arrow-right-bold'

interface Props {
    story: SharedExpenseStory
    onClick?: () => void
}

export function SharedExpenseStoryRow({ story, onClick }: Props) {
    const vendor = story.vendor

    return (
        <div key={story.sharedExpense.id}>
            <div
                className={`theme-dark bg-app-primary hover:bg-app-secondary cursor-pointer shadow-xl flex flex-row rounded justify-between items-center mt-2 mb-2`}
                onClick={(e) => {
                    if (onClick) {
                        onClick()
                    }
                }}
            >
                <div className={`flex flex-row justify-start items-center ml-4 max-w-tiny`}>
                    <div className={`flex flex-col relative items-center justify-center`}>
                        {vendor?.logoUploadCompleted && vendor.logoUrl && (
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                                <img className={'h-full w-full'} src={vendor.logoUrl} alt={vendor.friendlyName} />
                            </span>
                        )}

                        {!vendor && (
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                                <img
                                    className={'h-full w-full'}
                                    src={'/static/images/clock-icon-white-clipped.png'}
                                    alt={'clock-icon'}
                                />
                            </span>
                        )}
                    </div>

                    <div className={`flex flex-col items-start p-4`}>
                        <span className={`text-gray-400 font-bold text-md`}>{story.sharedExpense.expenseNickName}</span>
                        <span className={`text-gray-500 font-thin text-sm`}>{`Created by ${
                            story.initiatingUser.firstName
                        } ${story.initiatingUser.lastName} on ${formatDateVerbose(
                            new Date(Date.parse(story.sharedExpense.dateTimeCreated))
                        )}`}</span>
                    </div>
                </div>
                {onClick && (
                    <div className={`mr-4`}>
                        <ArrowRightBold color={`#cbd5e0`} className={`h-24`} />
                    </div>
                )}
            </div>
        </div>
    )
}

interface AgreementStoryProps {
    story: UserAgreementStory
    onClick?: () => void
}

export function UserAgreementStoryRow(props: AgreementStoryProps) {
    console.log(props)
    return (
        <Link to={`/dashboard/agreement/${props.story.userAgreement.id}`} onClick={props.onClick}>
            {/* The onClick prop here is just a quick hack to make the right arrow appear*/}
            <SharedExpenseStoryRow story={props.story} onClick={() => {}} />
        </Link>
    )
}
