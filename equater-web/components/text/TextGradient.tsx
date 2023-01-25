interface Props {
    children: string
    className?: string
}

export function TextGradient(props: Props) {
    return (
        <b
            className={`relative inline text-transparent bg-clip-text bg-gradient-to-r from-app-royal-blue-light to-app-accent-light ${
                props.className || ''
            }`}
        >
            {props.children}
        </b>
    )
}
