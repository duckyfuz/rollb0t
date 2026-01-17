import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const VOLUME_MAP: Record<number, number> = {
    0: 0,
    1: 0.1,
    2: 0.5,
    3: 1.0,
    4: 0.1,
    5: 0.5,
    6: 1.0
}

let lastPrankTime = 0
const PRANK_COOLDOWN = 1500 // ms

export async function playPrankSound(severity: number) {
    if (severity === 0) return

    const now = Date.now()
    if (now - lastPrankTime < PRANK_COOLDOWN) return

    const soundUrl = await storage.get<string>("sound_url")
    if (!soundUrl) return

    lastPrankTime = now

    const audio = new Audio(soundUrl)
    audio.volume = VOLUME_MAP[severity] || 0
    audio.play().catch(() => {
        // Audio might fail to play if user hasn't interacted with the page yet
    })
}

export function applyPrankMedia(severityLevel: number, imageUrl?: string) {
    const mediaElements = document.querySelectorAll("img, source")
    mediaElements.forEach((el: HTMLImageElement | HTMLSourceElement) => {
        // Apply for duck_03 (3) or transform_03 (6)
        if ((severityLevel === 3 || severityLevel === 6) && imageUrl) {
            if (el.tagName === "IMG" && !el.hasAttribute("data-original-src")) {
                const img = el as HTMLImageElement
                img.setAttribute("data-original-src", img.src)
                img.src = imageUrl
            }

            if (el.hasAttribute("srcset") && !el.hasAttribute("data-original-srcset")) {
                el.setAttribute("data-original-srcset", el.getAttribute("srcset") || "")
                el.setAttribute("srcset", imageUrl)
            }
        } else {
            // Revert if severity is not 3 or 6, or if imageUrl is missing
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
}
