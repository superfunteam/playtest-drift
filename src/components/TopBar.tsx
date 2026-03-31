interface TopBarProps {
  runningScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function TopBar({
  runningScore,
  soundEnabled,
  onToggleSound
}: TopBarProps) {
  return (
    <section className="top-bar" aria-live="polite">
      <div className="score-pill" aria-label={`Total score ${runningScore}`}>
        <span>Score</span>
        <strong>{runningScore}</strong>
      </div>

      <button
        type="button"
        className="sound-toggle sound-toggle--icon"
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
      >
        <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
          {soundEnabled ? (
            <path
              d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"
              fill="currentColor"
            />
          ) : (
            <path
              d="m616-320-56-56 104-104-104-104 56-56 104 104 104-104 56 56-104 104 104 104-56 56-104-104-104 104Zm-496-40v-240h160l200-200v640L280-360H120Zm280-246-86 86H200v80h114l86 86v-252ZM300-480Z"
              fill="currentColor"
            />
          )}
        </svg>
      </button>
      <span className="sr-only" aria-live="polite">
        {soundEnabled ? 'Sound enabled' : 'Sound muted'}
      </span>
    </section>
  );
}
