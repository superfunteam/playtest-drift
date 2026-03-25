import { describe, expect, it } from 'vitest';
import { deterministicShuffle, seedForRound } from '../game/seed';

describe('deterministicShuffle', () => {
  it('returns the same order for the same seed', () => {
    const items = ['a', 'b', 'c', 'd'];
    const one = deterministicShuffle(items, seedForRound('seed-a', 'round-1'));
    const two = deterministicShuffle(items, seedForRound('seed-a', 'round-1'));
    expect(one).toEqual(two);
  });

  it('returns a different order for a different seed', () => {
    const items = ['a', 'b', 'c', 'd'];
    const one = deterministicShuffle(items, seedForRound('seed-a', 'round-1'));
    const two = deterministicShuffle(items, seedForRound('seed-b', 'round-1'));
    expect(one).not.toEqual(two);
  });

  it('keeps all original members exactly once', () => {
    const items = ['a', 'b', 'c', 'd'];
    const shuffled = deterministicShuffle(items, seedForRound('seed-c', 'round-2'));
    expect(new Set(shuffled)).toEqual(new Set(items));
    expect(shuffled).toHaveLength(items.length);
  });
});
