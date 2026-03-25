import { describe, expect, it } from 'vitest';
import { initialSessionState, sessionReducer } from '../game/session-state';
import type { DriftRound } from '../game/types';

function buildRound(id: string): DriftRound {
  return {
    id,
    theme: `Theme ${id}`,
    prompt: `Prompt ${id}`,
    items: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
      { key: 'd', label: 'D' }
    ],
    correctOrder: ['a', 'b', 'c', 'd'],
    reveal: [
      { key: 'a', year: '1', description: 'A' },
      { key: 'b', year: '2', description: 'B' },
      { key: 'c', year: '3', description: 'C' },
      { key: 'd', year: '4', description: 'D' }
    ]
  };
}

function bootedState(roundCount = 5) {
  const rounds = Array.from({ length: roundCount }, (_, index) => buildRound(`r${index + 1}`));
  const roundStartOrders = Object.fromEntries(rounds.map((round) => [round.id, ['d', 'c', 'b', 'a']]));

  return sessionReducer(initialSessionState, {
    type: 'BOOT_SUCCESS',
    seed: 'seed',
    rounds,
    roundStartOrders,
    sessionRef: 'session-1'
  });
}

describe('sessionReducer', () => {
  it('supports the simplified transition flow', () => {
    let state = bootedState();
    expect(state.phase).toBe('playing');

    state = sessionReducer(state, { type: 'SUBMIT_REQUEST' });
    expect(state.phase).toBe('revealing');
    expect(state.isSubmitting).toBe(true);

    state = sessionReducer(state, {
      type: 'SUBMIT_SUCCESS',
      submittedOrder: ['d', 'c', 'b', 'a'],
      evaluation: {
        positionsCorrect: [false, false, false, false],
        roundScore: 0,
        canonicalOrder: ['a', 'b', 'c', 'd'],
        reveal: buildRound('x').reveal
      }
    });

    expect(state.phase).toBe('revealing');
    expect(state.isSubmitting).toBe(false);
    expect(state.currentResult?.roundScore).toBe(0);

    state = sessionReducer(state, { type: 'ADVANCE_ROUND' });
    expect(state.phase).toBe('playing');
    expect(state.currentRoundIndex).toBe(1);
  });

  it('blocks duplicate submit while already submitting', () => {
    let state = bootedState();
    state = sessionReducer(state, { type: 'SUBMIT_REQUEST' });
    const next = sessionReducer(state, { type: 'SUBMIT_REQUEST' });
    expect(next).toEqual(state);
  });

  it('locks reorder when not in playing phase', () => {
    let state = bootedState();
    state = sessionReducer(state, { type: 'SUBMIT_REQUEST' });
    const next = sessionReducer(state, { type: 'REORDER', order: ['a', 'b', 'c', 'd'] });
    expect(next.currentOrder).toEqual(state.currentOrder);
  });

  it('reaches complete after final round reveal', () => {
    let state = bootedState(1);
    state = sessionReducer(state, { type: 'SUBMIT_REQUEST' });
    state = sessionReducer(state, {
      type: 'SUBMIT_SUCCESS',
      submittedOrder: ['a', 'b', 'c', 'd'],
      evaluation: {
        positionsCorrect: [true, true, true, true],
        roundScore: 4,
        canonicalOrder: ['a', 'b', 'c', 'd'],
        reveal: buildRound('x').reveal
      }
    });

    state = sessionReducer(state, { type: 'ADVANCE_ROUND' });
    expect(state.phase).toBe('complete');
    expect(state.runningScore).toBe(4);
  });
});
