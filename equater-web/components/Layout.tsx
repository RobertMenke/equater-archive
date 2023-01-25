import * as React from 'react'
import { FC } from 'react'
import { BaseProps } from '../types/BaseProps'
import { Footer } from './Footer'
import { Header } from './Header'

interface Props extends BaseProps {
    hideHeader?: boolean
    hideFooter?: boolean
}

const Layout: FC<Props> = (props: Props) => (
    <div className={`theme-dark flex flex-col m-0 p-0 bg-app-primary`}>
        <Header style={props.hideHeader ? { display: 'none' } : undefined} />
        <div className={'m-0 p-0 bg-app-primary h-screen'}>
            {props.children}
            <Footer style={props.hideFooter ? { display: 'none' } : undefined} />
        </div>
    </div>
)

export default Layout
