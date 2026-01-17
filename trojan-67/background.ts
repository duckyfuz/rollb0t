import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const mapResponseToSeverity = (data: any) => {
    const status = Array.isArray(data) ? data[0] : data
    if (!status || !status.is_enabled) return 0

    switch (status.theme) {
        case "duck_01": return 1 // Mild
        case "duck_02": return 2 // Wacky
        case "duck_03": return 3 // QUACK
        default: return 0
    }
}

async function syncSeverity() {
    try {
        const username = await storage.get<string>("username")
        if (!username) return

        const response = await fetch(`https://trojan-test.kenf.dev/users/${username}/status`)
        if (response.status === 200) {
            const data = await response.json()
            const newSeverity = mapResponseToSeverity(data)
            await storage.set("severity", newSeverity)
            console.log(`Synced severity for ${username}: ${newSeverity}`)
        }
    } catch (error) {
        console.error("Background sync failed:", error)
    }
}

// Listen for sync requests from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SYNC_SEVERITY") {
        syncSeverity().then(() => sendResponse({ success: true }))
        return true // keep channel open for async response
    }
})

// Trigger sync on startup
syncSeverity()

console.log("Duck Prank Background Script Initialized with Sync Logic")
