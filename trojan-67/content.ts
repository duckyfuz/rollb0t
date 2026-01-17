import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const EXCLUDED_TAGS = new Set([
    "FORM", "INPUT", "TEXTAREA", "BUTTON",
    "CODE", "PRE", "KBD"
])

const SEVERITY_MAP: Record<number, number> = {
    0: 0,
    1: 0.01,
    2: 0.05,
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
 * Transforms a paragraph by splitting it into words and applying the duckify 
 * transformation to each word based on the threshold.
 */
function processTextWithThreshold(text: string, threshold: number): string {
    // Regex to match "words" (alphanumeric sequences) vs "non-words" (whitespace, punctuation)
    const parts = text.split(/(\s+|[^\w\s]+)/g)

    return parts.map(part => {
        // If it's a word (contains alphanumeric), check threshold
        if (/\w/.test(part)) {
            if (Math.random() < threshold) {
                return duckify(part)
            }
        }
        return part
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
 * Stores original text to allow real-time severity changes.
 */
let isTransforming = false

// Initialize observer first so it can be managed by applyPrank
const observer = new MutationObserver(() => {
    applyPrank()
})

async function applyPrank(forcedSeverity?: number) {
    if (isTransforming) return
    isTransforming = true

    // Disconnect observer while making changes to prevent infinite loop
    observer.disconnect()

    try {
        const severityLevel =
            forcedSeverity !== undefined
                ? forcedSeverity
                : (await storage.get<number>("severity")) || 0
        const threshold = SEVERITY_MAP[severityLevel]

        const paragraphs = document.querySelectorAll("p")

        paragraphs.forEach((p: HTMLElement) => {
            if (isExcluded(p)) return

            // Initialize original text tracking
            if (!p.hasAttribute("data-original-text")) {
                if (p.textContent.length < 20) return
                p.setAttribute("data-original-text", p.textContent)
            }

            const originalText = p.getAttribute("data-original-text") || ""
            const appliedLevel = parseInt(p.getAttribute("data-duckified-level") || "-1")

            if (threshold > 0) {
                // Only transform if the severity level has changed
                if (appliedLevel !== severityLevel) {
                    const newText = processTextWithThreshold(originalText, threshold)
                    p.textContent = newText
                    p.setAttribute("data-duckified", "true")
                    p.setAttribute("data-duckified-level", severityLevel.toString())
                }
            } else {
                // Revert if severity is 0 and it was previously duckified
                if (p.hasAttribute("data-duckified")) {
                    p.textContent = originalText
                    p.removeAttribute("data-duckified")
                    p.removeAttribute("data-duckified-level")
                }
            }
        })
    } catch (error) {
        console.error("Duck prank transformation failed:", error)
    } finally {
        // Always re-observe
        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
        isTransforming = false
    }
}

// Initial application
applyPrank()

// Listen for storage changes to react immediately if the user changes severity
storage.watch({
    severity: (c) => {
        applyPrank(c.newValue)
    }
})
