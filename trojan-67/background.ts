import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const mapResponseToSeverity = (data: any) => {
    const status = Array.isArray(data) ? data[0] : data
    if (!status || !status.is_enabled) return 0

    switch (status.theme) {
        case "duck_01": return 1 // Mild
        case "duck_02": return 2 // Wacky
        case "duck_03": return 3 // QUACK
        case "transform_01": return 4 // Transform 10%
        case "transform_02": return 5 // Transform 25%
        case "transform_03": return 6 // Transform 50%
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
        return true
    }

    if (message.type === "TRANSFORM_TEXT") {
        const { text } = message
        storage.get<string>("username").then(async (username) => {
            if (!username) {
                sendResponse({ success: false, error: "No username" })
                return
            }
            try {
                const response = await fetch(`https://trojan-test.kenf.dev/users/${username}/transform`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                })
                if (response.ok) {
                    const data = await response.json()
                    sendResponse({ success: true, transformed_text: data.transformed_text })
                } else {
                    sendResponse({ success: false, error: "API failed" })
                }
            } catch (error) {
                sendResponse({ success: false, error: error.message })
            }
        })
        return true
    }
})

// Trigger sync on startup
syncSeverity()

console.log("Duck Prank Background Script Initialized with Sync Logic")
