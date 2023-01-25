// @ts-ignore
import * as Pica from 'pica/dist/pica'

export function base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}

export function convertImageUrlToBuffer(url: string): ArrayBufferLike {
    return base64ToArrayBuffer(url.split(',')[1])
}

export function resizeImage(imageData: string, width: number, height: number): Promise<string> {
    const image = new Image()

    const canvasDataUrlPromise: Promise<string> = new Promise((resolve, reject) => {
        image.onload = async () => {
            console.log(Pica)
            const pica = Pica({ features: ['js', 'wasm', 'ww', 'cib'] })
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const result = await pica.resize(image, canvas, {
                unsharpAmount: 80,
                unsharpRadius: 0.6,
                unsharpThreshold: 2
            })

            resolve(result.toDataURL())
        }

        image.onerror = reject
    })

    image.src = imageData

    return canvasDataUrlPromise
}
/**
 * Note: This is assuming that a comparison like (T, T) => boolean can be performed accurately via a === comparison
 *
 * @param list
 */
export function removeDuplicates<T>(list: T[]): T[] {
    const seen = new Map<T, number>()
    const out = []
    const length = list.length
    let j = 0

    for (let i = 0; i < length; i++) {
        const item = list[i]
        if (!seen.has(item)) {
            seen.set(item, 1)
            out[j++] = item
        }
    }

    return out
}

export function removeDuplicatesWithSelector<T, V>(list: T[], f: (item: T) => V): T[] {
    const seen = new Map<V, number>()
    const out = []
    const length = list.length
    let j = 0
    for (let i = 0; i < length; i++) {
        const item = list[i]
        const key = f(item)
        if (!seen.has(key)) {
            seen.set(key, 1)
            out[j++] = item
        }
    }
    return out
}
