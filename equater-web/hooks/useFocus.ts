import { MutableRefObject, useRef } from 'react'

export function useFocus<E extends HTMLElement>(): [MutableRefObject<E | null>, () => void] {
    const htmlElRef = useRef<E>(null)
    const setFocus = () => htmlElRef.current && htmlElRef.current.focus()

    return [htmlElRef, setFocus]
}
