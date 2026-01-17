import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

function IndexPopup() {
  const [username, setUsername] = useStorage<string>("username")
  const [severity, setSeverity] = useStorage<number>("severity", 0)

  const [inputUsername, setInputUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUsername.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`https://trojan-test.kenf.dev/users/${inputUsername.trim()}/status`)

      if (response.status === 200) {
        await setUsername(inputUsername.trim())
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

  const levels = [
    { value: 0, label: "Disabled", percent: "0%" },
    { value: 1, label: "Mild", percent: "1%" },
    { value: 2, label: "Wacky", percent: "5%" },
    { value: 3, label: "QUACK", percent: "50%" }
  ]

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Duck Prank</h1>
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
      <p className="subtitle">Select your severity level</p>

      <div className="severity-options">
        {levels.map((level) => (
          <label
            key={level.value}
            className={`severity-option ${severity === level.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="severity"
              value={level.value}
              checked={severity === level.value}
              onChange={() => setSeverity(level.value)}
            />
            <span>{level.label}</span>
            <span className="severity-level">{level.percent}</span>
          </label>
        ))}
      </div>

      <div className="status-bar">
        <div className={`status-indicator ${severity > 0 ? 'active' : ''}`} />
        {severity > 0 ? 'Active' : 'Inactive'}
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        Logged in as: <strong>{username}</strong>
      </div>
    </div>
  )
}

export default IndexPopup
