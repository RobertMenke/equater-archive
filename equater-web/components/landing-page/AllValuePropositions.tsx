import * as React from 'react'
import { SvgLikeColorFilled } from '../icons/hero-icons/LikeColorFilled'
import { SvgLockFlow } from '../icons/hero-icons/LockFlow'
import { SvgMoonViolet } from '../icons/hero-icons/MoonViolet'
import { SvgPhoneWithDialPad } from '../icons/hero-icons/PhoneWithDialpadCommunicationColor'
import { SvgSettingColorFilled } from '../icons/hero-icons/SettingColorFilled'
import { SvgWindNatureColor } from '../icons/hero-icons/WindNatureColor'
import { ValuePropCard } from './ValuePropCard'

export function AllValuePropositions() {
    return (
        <div className={'flex flex-col items-center justify-center'}>
            <div className={'flex flex-col m-2 md:m-16'}>
                <span
                    className={
                        'text-primary text-2xl md:text-3xl text-left sm:text-center mx-6 sm:mx-2 font-bold mb-2 md:mb-4 leading-8 pt-2 pb-2'
                    }
                >
                    An experience that delights at every step
                </span>
                <span className={'text-secondary text-base md:text-xl text-left sm:text-center mx-6 sm:mx-2'}>
                    Designed to enhance your life
                </span>
            </div>
            <div className={'flex flex-row flex-wrap value-prop-grid'}>
                <ValuePropCard
                    icon={<SvgLikeColorFilled />}
                    title={'Simple'}
                    description={
                        'We live in a world where sharing bills is hard. We decided to change that. Go from sign up to split up in under 2 minutes.'
                    }
                />
                <ValuePropCard
                    icon={<SvgSettingColorFilled />}
                    title={'Flexible'}
                    description={
                        'Whether you split things up evenly or not we’ve got you covered. When you’re done sharing, cancel with a single tap.'
                    }
                />
                <ValuePropCard
                    icon={<SvgWindNatureColor />}
                    title={'Out of sight, out of mind'}
                    description={
                        'Set it and forget it. We’ll send you a push notification when we’ve finished splitting up the bill.'
                    }
                />
                <ValuePropCard
                    icon={<SvgMoonViolet />}
                    title={'Light or dark interface'}
                    description={'A sleek user interface in whichever style you prefer.'}
                />
                <ValuePropCard
                    icon={<SvgLockFlow />}
                    title={'Secure'}
                    description={'End to end encrypted using AES 256 and RSA 2048 cryptography.'}
                />
                <ValuePropCard
                    icon={<SvgPhoneWithDialPad />}
                    title={'Great support'}
                    description={
                        'Text us, call us, or email us. Our US-based support team is always here to help with a smile :).'
                    }
                />
            </div>
        </div>
    )
}
