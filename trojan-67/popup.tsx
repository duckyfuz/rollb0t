import { useStorage } from "@plasmohq/storage/hook"

import "./style.css"

function IndexPopup() {
  const [severity, setSeverity] = useStorage<number>("severity", 0)

  const handleSeverityChange = (value: number) => {
    setSeverity(value)
  }

  return (
    <div className="popup-container">
      <h1>Duck Prank Settings</h1>
      <p>Choose your duck level:</p>
      <div className="severity-options">
        {[0, 1, 2, 3].map((level) => (
          <label key={level} className="severity-option">
            <input
              type="radio"
              name="severity"
              value={level}
              checked={severity === level}
              onChange={() => handleSeverityChange(level)}
            />
            <span>
              {level === 0 ? "Disabled (0%)" :
                level === 1 ? "Mild (1%)" :
                  level === 2 ? "Wacky (5%)" :
                    "QUACK (50%)"}
            </span>
          </label>
        ))}
      </div>
      <div className="status">
        Current Level: <strong>{severity}</strong>
      </div>
    </div>
  )
}

export default IndexPopup
