import { SEVERITY_MAP } from "./utils"

export function duckify(text: string): string {
    return text.split('').map(char => {
        if (/[a-zA-Z0-9]/.test(char)) {
            return '🦆'
        }
        return char
    }).join('')
}

export function processTextWithThreshold(text: string, threshold: number): string {
    const parts = text.split(/(\s+|[^\w\s]+)/g)
    return parts.map(part => {
        if (/\w/.test(part)) {
            if (Math.random() < threshold) {
                return duckify(part)
            }
        }
        return part
    }).join('')
}
