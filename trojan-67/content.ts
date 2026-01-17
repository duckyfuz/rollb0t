import { Storage } from "@plasmohq/storage"
import duckImage from "data-base64:~assets/duck.jpg"
import quackAudio from "data-base64:~assets/quack.mp3"

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

const VOLUME_MAP: Record<number, number> = {
    0: 0,
    1: 0.1,
    2: 0.5,
    3: 1.0
}

let currentSeverity = 0
let lastQuackTime = 0
const QUACK_COOLDOWN = 1500 // ms

/**
 * Plays the quack sound with volume based on current severity.
 * Throttled to prevent audio overlapping too much.
 */
function playQuack() {
    if (currentSeverity === 0) return

    const now = Date.now()
    if (now - lastQuackTime < QUACK_COOLDOWN) return
    lastQuackTime = now

    const audio = new Audio(quackAudio)
    audio.volume = VOLUME_MAP[currentSeverity] || 0
    audio.play().catch(() => {
        // Audio might fail to play if user hasn't interacted with the page yet
        // Browser's autoplay policy
    })
}

// Add scroll listener for the audio prank
window.addEventListener("scroll", () => {
    playQuack()
}, { passive: true })

// ... (duckify and processTextWithThreshold remain unchanged)
function duckify(text: string): string {
    return text.split('').map(char => {
        if (/[a-zA-Z0-9]/.test(char)) {
            return '🦆'
        }
        return char
    }).join('')
}

function processTextWithThreshold(text: string, threshold: number): string {
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

function isExcluded(element: HTMLElement): boolean {
    let curr: HTMLElement | null = element
    while (curr) {
        if (EXCLUDED_TAGS.has(curr.tagName)) return true
        if (curr.contentEditable === "true") return true
        curr = curr.parentElement
    }
    return false
}

let isTransforming = false

const observer = new MutationObserver(() => {
    applyPrank()
})

async function applyPrank(forcedSeverity?: number) {
    if (isTransforming) return
    isTransforming = true

    observer.disconnect()

    try {
        const severityLevel =
            forcedSeverity !== undefined
                ? forcedSeverity
                : (await storage.get<number>("severity")) || 0

        currentSeverity = severityLevel // Sync for audio logic
        const threshold = SEVERITY_MAP[severityLevel]

        // 1. Handle Paragraphs
        const paragraphs = document.querySelectorAll("p")
        paragraphs.forEach((p: HTMLElement) => {
            if (isExcluded(p)) return

            if (!p.hasAttribute("data-original-text")) {
                if (p.textContent.length < 20) return
                p.setAttribute("data-original-text", p.textContent)
            }

            const originalText = p.getAttribute("data-original-text") || ""
            const appliedLevel = parseInt(p.getAttribute("data-duckified-level") || "-1")

            if (threshold > 0) {
                if (appliedLevel !== severityLevel) {
                    p.textContent = processTextWithThreshold(originalText, threshold)
                    p.setAttribute("data-duckified", "true")
                    p.setAttribute("data-duckified-level", severityLevel.toString())
                }
            } else {
                if (p.hasAttribute("data-duckified")) {
                    p.textContent = originalText
                    p.removeAttribute("data-duckified")
                    p.removeAttribute("data-duckified-level")
                }
            }
        })

        // 2. Handle Images & Sources (QUACK mode only)
        const mediaElements = document.querySelectorAll("img, source")
        mediaElements.forEach((el: HTMLImageElement | HTMLSourceElement) => {
            if (severityLevel === 3) {
                if (el.tagName === "IMG" && !el.hasAttribute("data-original-src")) {
                    const img = el as HTMLImageElement
                    img.setAttribute("data-original-src", img.src)
                    img.src = duckImage
                }

                if (el.hasAttribute("srcset") && !el.hasAttribute("data-original-srcset")) {
                    el.setAttribute("data-original-srcset", el.getAttribute("srcset") || "")
                    el.setAttribute("srcset", duckImage)
                }
            } else {
                if (el.hasAttribute("data-original-src")) {
                    const img = el as HTMLImageElement
                    img.src = img.getAttribute("data-original-src") || ""
                    img.removeAttribute("data-original-src")
                }

                if (el.hasAttribute("data-original-srcset")) {
                    el.setAttribute("srcset", el.getAttribute("data-original-srcset") || "")
                    el.removeAttribute("data-original-srcset")
                }
            }
        })

    } catch (error) {
        console.error("Duck prank transformation failed:", error)
    } finally {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset"]
        })
        isTransforming = false
    }
}

applyPrank()

storage.watch({
    severity: (c) => {
        applyPrank(c.newValue)
    }
})

// Trigger sync on tab refresh via background script
chrome.runtime.sendMessage({ type: "SYNC_SEVERITY" })
