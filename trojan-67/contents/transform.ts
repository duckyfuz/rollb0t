import { isExcluded } from "./utils"

interface TransformResponse {
    original_text: string
    transformed_text: string
    theme: string
}

const TRANSFORM_THRESHOLD_MAP: Record<number, number> = {
    4: 0.1,  // transform_01
    5: 0.25, // transform_02
    6: 0.5   // transform_03
}

export async function applyTransform(username: string, severityLevel: number) {
    if (severityLevel < 4 || severityLevel > 6) return

    const threshold = TRANSFORM_THRESHOLD_MAP[severityLevel]
    const paragraphs = document.querySelectorAll("p")

    for (const p of Array.from(paragraphs)) {
        if (isExcluded(p)) continue

        // Check if already transformed or duckified
        if (p.hasAttribute("data-transformed") || p.hasAttribute("data-duckified")) {
            // If the level is the same, skip
            if (p.getAttribute("data-transformed-level") === severityLevel.toString()) continue
        }

        if (Math.random() < threshold) {
            const originalText = p.hasAttribute("data-original-text")
                ? p.getAttribute("data-original-text")
                : p.textContent

            if (!originalText || originalText.length < 20) continue

            if (!p.hasAttribute("data-original-text")) {
                p.setAttribute("data-original-text", originalText)
            }

            p.classList.add("transform-pending")

            try {
                const response: any = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: "TRANSFORM_TEXT", text: originalText }, (res) => {
                        resolve(res)
                    })
                })

                if (response && response.success) {
                    p.textContent = response.transformed_text
                    p.setAttribute("data-transformed", "true")
                    p.setAttribute("data-transformed-level", severityLevel.toString())
                    p.removeAttribute("data-duckified")
                    p.removeAttribute("data-duckified-level")
                }
            } catch (error) {
                console.error("Transform via background failed:", error)
            } finally {
                p.classList.remove("transform-pending")
            }
        }
    }
}

export function revertTransform() {
    const paragraphs = document.querySelectorAll("[data-transformed]")
    paragraphs.forEach((p: HTMLElement) => {
        const originalText = p.getAttribute("data-original-text")
        if (originalText) {
            p.textContent = originalText
            p.removeAttribute("data-transformed")
            p.removeAttribute("data-transformed-level")
        }
    })
}
