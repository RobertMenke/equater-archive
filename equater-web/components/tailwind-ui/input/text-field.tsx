import { AppColor } from '../../../constants/colors'

interface Props {
    label: string
    value: string
    handleChange: (value: string) => void
    color?: AppColor
    className?: string
}

export function TextField(props: Props) {
    const color = props.color || AppColor.PRIMARY
    const colorClassName = color === AppColor.PRIMARY ? `app-primary` : `app-secondary`

    return (
        <div className={props.className || ''}>
            <label htmlFor="first_name" className="block text-sm font-medium leading-5 text-gray-600">
                {props.label}
            </label>
            <input
                className={`theme-dark bg-${colorClassName} mt-1 form-input block w-full py-2 px-3 border border-${colorClassName} rounded-md shadow-sm text-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5`}
                value={props.value}
                onChange={(event) => props.handleChange(event.currentTarget.value)}
            />
        </div>
    )
}
