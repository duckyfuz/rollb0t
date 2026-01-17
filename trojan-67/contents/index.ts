import { Storage } from "@plasmohq/storage"
import { isExcluded, SEVERITY_MAP } from "./utils"
import { applyDuckMedia, playQuack, processTextWithThreshold } from "./duckify"
import { applyTransform, revertTransform } from "./transform"

const storage = new Storage()
let currentSeverity = 0
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

        currentSeverity = severityLevel
        const username = await storage.get<string>("username")

        // Handle Duck logic (levels 1-3)
        const threshold = SEVERITY_MAP[severityLevel] || 0
        const paragraphs = document.querySelectorAll("p")

        if (severityLevel >= 1 && severityLevel <= 3) {
            revertTransform() // Ensure no transform active
            paragraphs.forEach((p: HTMLElement) => {
                if (isExcluded(p)) return

                if (!p.hasAttribute("data-original-text")) {
                    if (p.textContent.length < 20) return
                    p.setAttribute("data-original-text", p.textContent)
                }

                const originalText = p.getAttribute("data-original-text") || ""
                const appliedLevel = parseInt(p.getAttribute("data-duckified-level") || "-1")

                if (appliedLevel !== severityLevel) {
                    p.textContent = processTextWithThreshold(originalText, threshold)
                    p.setAttribute("data-duckified", "true")
                    p.setAttribute("data-duckified-level", severityLevel.toString())
                    p.removeAttribute("data-transformed")
                    p.removeAttribute("data-transformed-level")
                }
            })
            applyDuckMedia(severityLevel)
        } else if (severityLevel >= 4 && severityLevel <= 6) {
            // Handle Transform logic (levels 4-6)
            // First revert any duckification if present
            paragraphs.forEach((p: HTMLElement) => {
                if (p.hasAttribute("data-duckified")) {
                    p.textContent = p.getAttribute("data-original-text") || ""
                    p.removeAttribute("data-duckified")
                    p.removeAttribute("data-duckified-level")
                }
            })
            applyDuckMedia(0) // Revert images

            if (username) {
                await applyTransform(username, severityLevel)
            }
        } else {
            // Revert everything
            paragraphs.forEach((p: HTMLElement) => {
                if (p.hasAttribute("data-duckified") || p.hasAttribute("data-transformed")) {
                    p.textContent = p.getAttribute("data-original-text") || ""
                    p.removeAttribute("data-duckified")
                    p.removeAttribute("data-duckified-level")
                    p.removeAttribute("data-transformed")
                    p.removeAttribute("data-transformed-level")
                }
            })
            applyDuckMedia(0)
        }

    } catch (error) {
        console.error("Prank application failed:", error)
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

// Initialize
applyPrank()

// Audio trigger on scroll
window.addEventListener("scroll", () => {
    if (currentSeverity >= 1 && currentSeverity <= 3) {
        playQuack(currentSeverity)
    }
}, { passive: true })

storage.watch({
    severity: (c) => {
        applyPrank(c.newValue)
    }
})

// Trigger sync on tab refresh via background script
chrome.runtime.sendMessage({ type: "SYNC_SEVERITY" })
