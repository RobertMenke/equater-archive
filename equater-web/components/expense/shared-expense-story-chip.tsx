import * as React from 'react'
import { SharedExpenseStory } from '../../types/shared-expense'
import { formatDateVerbose } from '../../utils/date.utils'

interface Props {
    story: SharedExpenseStory
    onClick?: () => void
}

export function SharedExpenseStoryChip({ story, onClick }: Props) {
    return (
        <div style={{ minWidth: '400px' }}>
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
                        {story?.vendor?.logoUploadCompleted && story.vendor.logoUrl && (
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden">
                                <img
                                    className={'h-full w-full'}
                                    src={story.vendor.logoUrl}
                                    alt={story.vendor.friendlyName}
                                />
                            </span>
                        )}

                        {!story.vendor && (
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
            </div>
        </div>
    )
}
