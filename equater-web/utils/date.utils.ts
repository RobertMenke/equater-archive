import { format } from 'date-fns'

export function formatDateVerbose(date: Date): string {
    return format(date, 'MMMM, d, yyyy')
}
