import { MutableRefObject, useEffect } from 'react'

export function useOutsideClickDetection(
    ref: MutableRefObject<HTMLElement | null>,
    callback: () => void | Promise<void>
) {
    function handleClickOutside(event: MouseEvent) {
        // @ts-ignore
        if (event.currentTarget && ref.current && !ref.current.contains(event.target)) {
            callback()
        }
    }

    useEffect(() => {
        // Bind the event listener
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener('mousedown', handleClickOutside)
        }
    })
}
