export async function runAfter<R>(time: number, f: () => R | Promise<R>): Promise<R> {
    return new Promise((resolve) => {
        setTimeout(async () => {
            resolve(await f())
        }, time)
    })
}

export function randomEnum<T>(anEnum: T): T[keyof T] {
    const enumValues = Object.keys(anEnum)
        .map((n) => Number.parseInt(n))
        .filter((n) => !Number.isNaN(n)) as unknown as T[keyof T][]
    const randomIndex = Math.floor(Math.random() * enumValues.length)

    return enumValues[randomIndex]
}
