import { describe, expect, it } from 'vitest';
import { createFixtureProvider } from '../data/fixture-provider';

describe('fixture provider', () => {
  it('loads exactly 5 rounds with 4 words each', async () => {
    const provider = createFixtureProvider();
    const payload = await provider.loadSession('seed');

    expect(payload.rounds).toHaveLength(5);
    for (const round of payload.rounds) {
      expect(round.items).toHaveLength(4);
      expect(round.reveal).toHaveLength(4);
    }
  });

  it('scores round submissions with deterministic evaluation', async () => {
    const provider = createFixtureProvider();
    const payload = await provider.loadSession('seed');
    const first = payload.rounds[0];

    const result = await provider.submitRound({
      round: first,
      order: first.correctOrder,
      sessionRef: payload.sessionRef
    });

    expect(result.roundScore).toBe(4);
    expect(result.positionsCorrect).toEqual([true, true, true, true]);
  });
});
