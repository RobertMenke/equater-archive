export type Action<Enum, State> = Partial<State> & {
    type: Enum
}
