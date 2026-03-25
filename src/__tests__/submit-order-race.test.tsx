import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { DriftProvider, RuntimeConfig } from '../data/provider';
import type { DriftRound } from '../game/types';

vi.mock('../components/RoundBoard', () => ({
  RoundBoard: ({
    onOrderChange,
    onSubmit
  }: {
    onOrderChange: (nextOrder: string[]) => void;
    onSubmit: (submittedOrder: string[]) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onOrderChange(['a', 'b', 'c', 'd']);
        onSubmit(['d', 'c', 'b', 'a']);
      }}
    >
      Submit Race
    </button>
  )
}));

const runtime: RuntimeConfig = {
  source: 'fixture',
  seed: 'drift-test-seed',
  gameSlug: 'drift',
  testMode: true
};

function makeRound(): DriftRound {
  return {
    id: 'round-1',
    theme: 'Theme',
    prompt: 'Prompt',
    items: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
      { key: 'd', label: 'D' }
    ],
    correctOrder: ['d', 'c', 'b', 'a'],
    reveal: [
      { key: 'd', year: '1', description: 'D' },
      { key: 'c', year: '2', description: 'C' },
      { key: 'b', year: '3', description: 'B' },
      { key: 'a', year: '4', description: 'A' }
    ]
  };
}

function makeProvider(rounds: DriftRound[]): DriftProvider {
  return {
    loadSession: vi.fn(async () => ({ rounds, sessionRef: 'session-1' })),
    submitRound: vi.fn(async ({ round, order }: { round: DriftRound; order: string[] }) => {
      const positionsCorrect = round.correctOrder.map((key, index) => order[index] === key);
      return {
        positionsCorrect,
        roundScore: positionsCorrect.filter(Boolean).length,
        canonicalOrder: round.correctOrder,
        reveal: round.reveal
      };
    }),
    completeSession: vi.fn(async () => {})
  };
}

describe('submit order race protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('submits the live board order even when reorder and submit happen in the same tick', async () => {
    const user = userEvent.setup();
    const provider = makeProvider([makeRound()]);

    render(<App runtimeOverride={runtime} providerOverride={provider} />);

    await screen.findByRole('button', { name: /submit race/i });
    await user.click(screen.getByRole('button', { name: /submit race/i }));

    await waitFor(() => {
      expect(provider.submitRound).toHaveBeenCalledTimes(1);
    });

    expect(provider.submitRound).toHaveBeenCalledWith(
      expect.objectContaining({
        order: ['d', 'c', 'b', 'a']
      })
    );
  });
});
