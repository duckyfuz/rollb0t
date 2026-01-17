import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

function IndexPopup() {
  const [severity, setSeverity] = useStorage<number>("severity", 0)

  const levels = [
    { value: 0, label: "Disabled", percent: "0%" },
    { value: 1, label: "Mild", percent: "1%" },
    { value: 2, label: "Wacky", percent: "5%" },
    { value: 3, label: "QUACK", percent: "50%" }
  ]

  return (
    <div className="popup-container">
      <h1>Duck Prank</h1>
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
    </div>
  )
}

export default IndexPopup
