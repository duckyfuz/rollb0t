import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

function IndexPopup() {
  const [username, setUsername] = useStorage<string>("username")
  const [severity, setSeverity] = useStorage<number>("severity", 0)
  const [articlesCount, setArticlesCount] = useStorage<number>("articlesCount", 12)
  const [studyMinutes, setStudyMinutes] = useStorage<number>("studyMinutes", 42)

  const [inputUsername, setInputUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
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
              status.theme === "duck_03" ? 3 :
                status.theme === "transform_01" ? 4 :
                  status.theme === "transform_02" ? 5 :
                    status.theme === "transform_03" ? 6 : 0

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
      case 1: return "Subtle"
      case 2: return "Medium"
      case 3: return "Max"
      case 4: return "Subtle"
      case 5: return "Medium"
      case 6: return "Max"
      default: return "Disabled"
    }
  }

  const handlePlusOne = () => {
    // Refresh the current page to sync with backend
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id)
      }
    })
    // Also increment fake count locally for feedback
    setArticlesCount((prev) => (prev || 0) + 1)
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
        <h1>Study Insights</h1>
        <button
          onClick={() => setUsername(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Logout
        </button>
      </div>
      <p className="subtitle" style={{ marginBottom: '16px' }}>Focus Session Active</p>

      <div className="study-dashboard">
        <div className="study-card">
          <span className="study-card-value">{articlesCount}</span>
          <span className="study-card-label">Articles Read</span>
        </div>
        <div className="study-card">
          <span className="study-card-value">{studyMinutes}m</span>
          <span className="study-card-label">Focus Time</span>
        </div>
      </div>

      <button className="big-plus-button" onClick={handlePlusOne}>
        +1
        <span>Mark Article as Read</span>
      </button>

      <div className="system-toggle">
        <button
          className="toggle-btn"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          {isDetailsOpen ? '▲ Hide System Status' : '▼ Show System Status'}
        </button>

        <div className={`status-details ${isDetailsOpen ? 'open' : ''}`}>
          <div className="details-content">
            <div className="detail-row">
              <strong>Status:</strong>
              <span>{severity > 0 ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="detail-row">
              <strong>Severity:</strong>
              <span>{getSeverityLabel(severity)}</span>
            </div>
            <div className="detail-row">
              <strong>Theme:</strong>
              <span>{severity <= 3 ? (severity === 0 ? "None" : "Subtle-Max") : "Transformation"}</span>
            </div>
            <div className="detail-row">
              <strong>User:</strong>
              <span>{username}</span>
            </div>
            <button
              className="sync-button"
              onClick={() => syncSeverity(username)}
              disabled={isSyncing}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <div className={`sync-icon ${isSyncing ? 'spinning' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message" style={{ textAlign: 'center', marginTop: '12px' }}>{error}</div>}
    </div>
  )
}

export default IndexPopup
