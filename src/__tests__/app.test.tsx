import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { DriftProvider, RuntimeConfig } from '../data/provider';
import { deterministicShuffle, seedForRound } from '../game/seed';
import { playRevealTone } from '../game/audio';
import type { DriftRound } from '../game/types';

vi.mock('../game/audio', () => ({
  playRevealTone: vi.fn(async () => {})
}));

const runtime: RuntimeConfig = {
  source: 'fixture',
  seed: 'drift-test-seed',
  gameSlug: 'drift',
  testMode: true
};

function makeRound(id: string, theme: string, prompt: string, correctOrder: string[] = ['a', 'b', 'c', 'd']): DriftRound {
  return {
    id,
    theme,
    prompt,
    items: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
      { key: 'd', label: 'D' }
    ],
    correctOrder,
    reveal: [
      { key: 'a', year: '1', description: 'A' },
      { key: 'b', year: '2', description: 'B' },
      { key: 'c', year: '3', description: 'C' },
      { key: 'd', year: '4', description: 'D' }
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
        reveal: round.correctOrder.map((key) => round.reveal.find((entry) => entry.key === key)!)
      };
    }),
    completeSession: vi.fn(async () => {})
  };
}

function differentCanonical(startOrder: string[]): string[] {
  const candidateA = ['d', 'c', 'b', 'a'];
  if (candidateA.join('|') !== startOrder.join('|')) return candidateA;
  return ['a', 'c', 'b', 'd'];
}

describe('App gameplay loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('submits once per round, reveals, updates score, and advances rounds', async () => {
    const user = userEvent.setup();
    const firstRoundStartOrder = deterministicShuffle(['a', 'b', 'c', 'd'], seedForRound(runtime.seed, 'round-1'));
    const rounds = [
      makeRound('round-1', 'Theme One', 'Round One Prompt', firstRoundStartOrder),
      makeRound('round-2', 'Theme Two', 'Round Two Prompt')
    ];
    const provider = makeProvider(rounds);

    render(<App runtimeOverride={runtime} providerOverride={provider} />);

    await screen.findByRole('dialog', { name: /how to play/i });
    await user.click(screen.getByRole('button', { name: /start game/i }));
    await screen.findByText('Round One Prompt');

    const submitButton = screen.getByRole('button', { name: /submit order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(provider.submitRound).toHaveBeenCalledTimes(1);
    });

    const nextRoundButton = await screen.findByRole('button', { name: /next round/i }, { timeout: 3500 });
    expect(screen.getByLabelText(/total score/i)).toHaveTextContent('4');
    expect(document.querySelectorAll('.drift-row--correct').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeInTheDocument();

    await user.click(nextRoundButton);
    await screen.findByText('Round Two Prompt');
  });

  it('mutes reveal tones when sound is toggled off', async () => {
    const user = userEvent.setup();
    const startOrder = deterministicShuffle(['a', 'b', 'c', 'd'], seedForRound(runtime.seed, 'round-1'));
    const round = makeRound('round-1', 'Theme One', 'Round One Prompt', differentCanonical(startOrder));
    const provider = makeProvider([round]);

    render(<App runtimeOverride={runtime} providerOverride={provider} />);

    await screen.findByRole('dialog', { name: /how to play/i });
    await user.click(screen.getByRole('button', { name: /start game/i }));
    await screen.findByText('Round One Prompt');

    await user.click(screen.getByRole('button', { name: /mute sound/i }));
    await user.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(provider.submitRound).toHaveBeenCalledTimes(1);
    });

    await screen.findByRole('button', { name: /see final score/i }, { timeout: 3500 });

    expect(playRevealTone).not.toHaveBeenCalled();
  });
});
