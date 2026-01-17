import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

function IndexPopup() {
  const [username, setUsername] = useStorage<string>("username")
  const [severity, setSeverity] = useStorage<number>("severity", 0)

  const [inputUsername, setInputUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState("")

  const syncSeverity = async (targetUsername: string) => {
    setIsSyncing(true)
    setError("")
    try {
      // Send message to background script to perform the sync
      chrome.runtime.sendMessage({ type: "SYNC_SEVERITY" }, (response) => {
        if (!response || !response.success) {
          setError("Sync failed. Check connection.")
        }
        setIsSyncing(false)
      })
    } catch (err) {
      setError("Sync failed. Check connection.")
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (username) {
      syncSeverity(username)
    }
  }, [username])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUsername.trim()) return

    setIsLoading(true)
    setError("")

    try {
      // First verify the user exists and get initial status
      const response = await fetch(`https://trojan-test.kenf.dev/users/${inputUsername.trim()}/status`)

      if (response.status === 200) {
        // Data mapping is now handled in background.ts primarily, 
        // but we do it once here to show immediate feedback in the popup
        const data = await response.json()
        const status = Array.isArray(data) ? data[0] : data
        const initialSeverity = (!status || !status.is_enabled) ? 0 :
          status.theme === "duck_01" ? 1 :
            status.theme === "duck_02" ? 2 :
              status.theme === "duck_03" ? 3 : 0

        await setSeverity(initialSeverity)
        await setUsername(inputUsername.trim())
        // Background sync will follow due to useEffect on username change
      } else if (response.status === 404) {
        setError("User not found. Please check your username.")
      } else {
        setError("An error occurred. Please try again.")
      }
    } catch (err) {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityLabel = (val: number) => {
    switch (val) {
      case 1: return "Mild"
      case 2: return "Wacky"
      case 3: return "QUACK"
      default: return "Disabled"
    }
  }

  if (!username) {
    return (
      <div className="popup-container">
        <div className="auth-container">
          <h1>Welcome</h1>
          <p className="subtitle">Enter your username to continue</p>

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="text"
              placeholder="Username"
              className="auth-input"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              disabled={isLoading}
            />
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading || !inputUsername.trim()}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Verifying...
                </>
              ) : "Authenticate"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1>Duck Status</h1>
        <button
          onClick={() => setUsername(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Logout
        </button>
      </div>

      <div className="status-card">
        <span className="status-label">Current Severity</span>
        <span className="status-value">{getSeverityLabel(severity)}</span>
        <span className="status-theme">{severity > 0 ? "Duck Mode Active" : "Ducks are Sleeping"}</span>

        <button
          className="sync-button"
          onClick={() => syncSeverity(username)}
          disabled={isSyncing}
        >
          <div className={`sync-icon ${isSyncing ? 'spinning' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="status-bar">
        <div className={`status-indicator ${severity > 0 ? 'active' : ''}`} />
        {severity > 0 ? 'Active' : 'Inactive'}
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        Logged in as: <strong>{username}</strong>
      </div>
      {error && <div className="error-message" style={{ textAlign: 'center', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}

export default IndexPopup
