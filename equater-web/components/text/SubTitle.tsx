import * as React from 'react'
import { FC } from 'react'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    text: string
}

const SubTitle: FC<Props> = (props) => (
    <span
        className={`text-secondary text-base md:text-xl text-center ${props.className ? props.className : ''}`}
        style={{ maxWidth: '700px' }}
    >
        {props.text}
    </span>
)

export default SubTitle
