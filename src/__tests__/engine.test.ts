import { describe, expect, it } from 'vitest';
import { evaluateRound } from '../game/engine';
import type { DriftRound } from '../game/types';

const sampleRound: DriftRound = {
  id: 'r1',
  theme: 'Theme',
  prompt: 'Prompt',
  items: [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'c', label: 'C' },
    { key: 'd', label: 'D' }
  ],
  correctOrder: ['a', 'b', 'c', 'd'],
  reveal: [
    { key: 'b', year: '2', description: 'B first in reveal array to test re-ordering.' },
    { key: 'a', year: '1', description: 'A' },
    { key: 'd', year: '4', description: 'D' },
    { key: 'c', year: '3', description: 'C' }
  ]
};

describe('evaluateRound', () => {
  it('scores exact position matches from 0 to 4', () => {
    const allWrong = evaluateRound(sampleRound, ['d', 'c', 'b', 'a']);
    expect(allWrong.roundScore).toBe(0);

    const twoCorrect = evaluateRound(sampleRound, ['a', 'b', 'd', 'c']);
    expect(twoCorrect.roundScore).toBe(2);
    expect(twoCorrect.positionsCorrect).toEqual([true, true, false, false]);

    const allCorrect = evaluateRound(sampleRound, ['a', 'b', 'c', 'd']);
    expect(allCorrect.roundScore).toBe(4);
  });

  it('returns reveal ordered by canonical order', () => {
    const result = evaluateRound(sampleRound, ['a', 'b', 'd', 'c']);
    expect(result.canonicalOrder).toEqual(['a', 'b', 'c', 'd']);
    expect(result.reveal.map((entry) => entry.key)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('rejects duplicate submitted keys', () => {
    expect(() => evaluateRound(sampleRound, ['a', 'a', 'c', 'd'])).toThrow('submitted_order_contains_duplicate_keys');
  });

  it('rejects missing submitted keys', () => {
    expect(() => evaluateRound(sampleRound, ['a', 'b', 'c'])).toThrow('round_or_submission_length_mismatch');
  });
});
