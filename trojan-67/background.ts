import { Storage } from "@plasmohq/storage"

/**
 * Plasmo's storage synchronization often requires the background script
 * to be active to handle persistence and broadcasting between parts of the extension.
 */
const storage = new Storage()

console.log("Duck Prank Background Script Initialized")
