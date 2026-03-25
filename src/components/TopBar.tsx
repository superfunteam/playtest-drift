import type { GamePhase } from '../game/types';

interface TopBarProps {
  roundNumber: number;
  totalRounds: number;
  runningScore: number;
  currentRoundScore: number | null;
  phase: GamePhase;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

function roundScoreLabel(score: number | null, phase: GamePhase): string {
  if (phase === 'playing' || score === null) {
    return 'Pending';
  }

  return `${score}/4`;
}

export function TopBar({
  roundNumber,
  totalRounds,
  runningScore,
  currentRoundScore,
  phase,
  soundEnabled,
  onToggleSound
}: TopBarProps) {
  return (
    <section className="top-bar" aria-live="polite">
      <div className="top-bar__stats">
        <div className="stat-chip">
          <span>Round</span>
          <strong>
            {Math.min(roundNumber, totalRounds)}/{totalRounds}
          </strong>
        </div>
        <div className="stat-chip">
          <span>This Round</span>
          <strong>{roundScoreLabel(currentRoundScore, phase)}</strong>
        </div>
        <div className="stat-chip">
          <span>Total</span>
          <strong>{runningScore}</strong>
        </div>
      </div>

      <button
        type="button"
        className="sound-toggle"
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
      >
        {soundEnabled ? 'Sound On' : 'Sound Off'}
      </button>
    </section>
  );
}
