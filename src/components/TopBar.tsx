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
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 6.5a.75.75 0 0 1 1.25-.56l4.73 4.31h2.27a.75.75 0 0 1 0 1.5h-2.27l-4.73 4.31A.75.75 0 0 1 12 15.5v-9z"
            fill="currentColor"
          />
          <path
            d="M6 10.25h3.1a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-2a.75.75 0 0 1 .75-.75z"
            fill="currentColor"
          />
          {soundEnabled ? (
            <path
              d="M16.35 8.15a.75.75 0 0 1 1.06 0 5.2 5.2 0 0 1 0 7.35.75.75 0 1 1-1.06-1.06 3.7 3.7 0 0 0 0-5.23.75.75 0 0 1 0-1.06zm2.6-2.35a.75.75 0 0 1 1.06 0 8.5 8.5 0 0 1 0 12.02.75.75 0 1 1-1.06-1.06 7 7 0 0 0 0-9.9.75.75 0 0 1 0-1.06z"
              fill="currentColor"
            />
          ) : (
            <path d="M18.8 6.2a.75.75 0 1 1 1.06 1.06L8.36 18.76a.75.75 0 1 1-1.06-1.06L18.8 6.2z" fill="currentColor" />
          )}
        </svg>
      </button>
      <span className="sr-only" aria-live="polite">
        {soundEnabled ? 'Sound enabled' : 'Sound muted'}
      </span>
    </section>
  );
}
