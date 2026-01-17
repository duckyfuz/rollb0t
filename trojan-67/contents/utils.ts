export const EXCLUDED_TAGS = new Set([
    "FORM", "INPUT", "TEXTAREA", "BUTTON",
    "CODE", "PRE", "KBD"
])

export function isExcluded(element: HTMLElement): boolean {
    let curr: HTMLElement | null = element
    while (curr) {
        if (EXCLUDED_TAGS.has(curr.tagName)) return true
        if (curr.contentEditable === "true") return true
        curr = curr.parentElement
    }
    return false
}

export const SEVERITY_MAP: Record<number, number> = {
    0: 0,
    1: 0.01,
    2: 0.05,
    3: 0.5
}
