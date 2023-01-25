interface Props {
    description: string
    keys: string[]
}

export function KeyboardShortcutHint(props: Props) {
    return (
        <div className={'flex flex-row theme-dark justify-center items-center'}>
            <span className={'font-bold mr-2'}>{props.description}</span>
            {props.keys.map((key) => (
                <div key={key} className={'flex bg-app-primary rounded justify-center items-center mx-0.5'}>
                    <span className={'py-1 px-1.5'}>{key}</span>
                </div>
            ))}
        </div>
    )
}
