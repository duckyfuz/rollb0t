import { SEVERITY_MAP } from "./utils"

const VOLUME_MAP: Record<number, number> = {
    0: 0,
    1: 0.1,
    2: 0.5,
    3: 1.0
}

let lastQuackTime = 0
const QUACK_COOLDOWN = 1500 // ms

export function playQuack(severity: number, soundUrl?: string) {
    if (severity === 0 || !soundUrl) return

    const now = Date.now()
    if (now - lastQuackTime < QUACK_COOLDOWN) return
    lastQuackTime = now

    const audio = new Audio(soundUrl)
    audio.volume = VOLUME_MAP[severity] || 0
    audio.play().catch(() => {
        // Audio might fail to play if user hasn't interacted with the page yet
    })
}

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

export function applyDuckMedia(severityLevel: number, imageUrl?: string) {
    const mediaElements = document.querySelectorAll("img, source")
    mediaElements.forEach((el: HTMLImageElement | HTMLSourceElement) => {
        if (severityLevel === 3 && imageUrl) {
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
