import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const EXCLUDED_TAGS = new Set([
    "FORM", "INPUT", "TEXTAREA", "BUTTON",
    "CODE", "PRE", "KBD"
])

const SEVERITY_MAP: Record<number, number> = {
    0: 0,
    1: 0.1,
    2: 0.3,
    3: 0.5
}

/**
 * Transforms a sentence into "duckified" text.
 * Replaces only alphanumeric characters with '🦆', matching character count.
 * Preserves punctuation and whitespace.
 */
function duckify(text: string): string {
    return text.split('').map(char => {
        if (/[a-zA-Z0-9]/.test(char)) {
            return '🦆'
        }
        return char
    }).join('')
}

/**
 * Checks if an element or any of its ancestors match excluded criteria.
 */
function isExcluded(element: HTMLElement): boolean {
    let curr: HTMLElement | null = element
    while (curr) {
        if (EXCLUDED_TAGS.has(curr.tagName)) return true
        if (curr.contentEditable === "true") return true
        curr = curr.parentElement
    }
    return false
}

/**
 * Main prank logic to apply transformations to the page.
 */
async function applyPrank() {
    const severityLevel = await storage.get<number>("severity") || 0
    const threshold = SEVERITY_MAP[severityLevel]

    if (threshold === 0) return

    const paragraphs = document.querySelectorAll("p:not([data-duckified])")

    paragraphs.forEach((p: HTMLElement) => {
        // Basic filtering
        if (p.textContent.length < 20) return
        if (isExcluded(p)) return

        // Apply severity threshold
        if (Math.random() > threshold) return

        // Transform content
        // We mark it as duckified BEFORE changing content to prevent infinite loops 
        // if the observer triggers on our own changes.
        p.setAttribute("data-duckified", "true")

        // We iterate over text nodes to preserve potential sub-elements like <a> tags
        // although the requirement says "Replace the text", preserving structure is better.
        // For simplicity based on requirements, we'll replace the text content of the P.
        const originalText = p.textContent
        p.textContent = duckify(originalText)
    })
}

// Initial application
applyPrank()

// Observe dynamic content
const observer = new MutationObserver(() => {
    applyPrank()
})

observer.observe(document.body, {
    childList: true,
    subtree: true
})

// Listen for storage changes to react immediately if the user changes severity
storage.watch({
    severity: (c) => {
        if (c.newValue > 0) {
            applyPrank()
        } else {
            // Note: Reverting the prank would require storing original text for every paragraph.
            // Given "idempotent" and "safe to disable", we'll just stop applying it to new content.
            // If full revert is needed, we'd need a more complex state management.
        }
    }
})
