import * as React from 'react'
import { FC } from 'react'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    text: string
}

const Title: FC<Props> = (props) => (
    <span className={'text-primary text-2xl md:text-4xl text-center font-bold'}>
        {props.text}
   </span>
)

export default Title
