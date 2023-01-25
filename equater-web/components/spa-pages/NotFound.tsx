import Router from 'next/router'
import { NotFoundIllustration } from '../illustration/shape-so/NotFoundIllustration'
import { Button, ButtonRole } from '../tailwind-ui/input/button'

export function NotFound() {
    if (typeof location === typeof undefined) {
        return null
    }

    return (
        <div className={'theme-dark bg-app-primary w-screen h-screen flex flex-col justify-center items-center'}>
            <NotFoundIllustration />
            <h1 className={'text-2xl my-8 text-primary font-bold'}>Content Not Found {location.pathname}</h1>
            <Button
                style={{ width: '240px', height: '60px' }}
                onClick={() => Router.push('/')}
                text={'Back to Home Page'}
                isLoading={false}
                role={ButtonRole.PRIMARY}
            />
        </div>
    )
}
