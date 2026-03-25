import type { DriftRound, RoundResult } from '../game/types';

interface SessionSummaryProps {
  rounds: DriftRound[];
  results: RoundResult[];
  score: number;
  maxScore: number;
  seed: string;
  onReplaySameSeed: () => void;
  onReplayNewSeed: () => void;
}

function mapByRoundId(results: RoundResult[]): Map<string, RoundResult> {
  return new Map(results.map((result) => [result.roundId, result]));
}

export function SessionSummary({
  rounds,
  results,
  score,
  maxScore,
  seed,
  onReplaySameSeed,
  onReplayNewSeed
}: SessionSummaryProps) {
  const resultByRoundId = mapByRoundId(results);

  return (
    <section className="card summary" aria-live="polite">
      <p className="summary__eyebrow">Session Complete</p>
      <h2>
        Final Score: {score}/{maxScore}
      </h2>
      <p className="summary__seed">
        Seed <code>{seed}</code>
      </p>

      <ul className="summary__list">
        {rounds.map((round, index) => {
          const result = resultByRoundId.get(round.id);

          return (
            <li key={round.id}>
              <span>
                {index + 1}. {round.theme}
              </span>
              <strong>{result ? `${result.roundScore}/4` : '-/4'}</strong>
            </li>
          );
        })}
      </ul>

      <div className="summary__actions">
        <button type="button" className="primary-button" onClick={onReplayNewSeed}>
          Play Again
        </button>
        <button type="button" className="secondary-button" onClick={onReplaySameSeed}>
          Replay Seed
        </button>
      </div>
    </section>
  );
}
