import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    url: string
}

export function CircularAvatar(props: Props) {
    return (
        <span className="inline-block relative">
            <img className="h-12 w-12 rounded-full" src={props.url} alt="" />
        </span>
    )
}

export function SquareAvatar(props: Props) {
    return (
        <span className="inline-block relative">
            <img className="h-12 w-12" src={props.url} alt="" />
        </span>
    )
}
