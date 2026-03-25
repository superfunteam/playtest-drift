import type { DriftRevealEntry, DriftRound, RoundEvaluation } from './types';

function requireDistinct(keys: string[], context: string): void {
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    throw new Error(`${context}_contains_duplicate_keys`);
  }
}

function ensureSameMembers(expected: string[], actual: string[]): void {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  if (expectedSet.size !== actualSet.size) {
    throw new Error('submitted_order_has_missing_or_extra_keys');
  }

  for (const key of expectedSet) {
    if (!actualSet.has(key)) {
      throw new Error('submitted_order_has_missing_or_extra_keys');
    }
  }
}

function orderReveal(canonicalOrder: string[], reveal: DriftRevealEntry[]): DriftRevealEntry[] {
  const revealMap = new Map(reveal.map((entry) => [entry.key, entry]));

  return canonicalOrder.map((key) => {
    const match = revealMap.get(key);
    if (!match) {
      throw new Error(`missing_reveal_for_key:${key}`);
    }
    return match;
  });
}

export function evaluateRound(round: DriftRound, submittedOrder: string[]): RoundEvaluation {
  const expectedKeys = round.items.map((item) => item.key);
  const canonicalOrder = round.correctOrder.slice();

  requireDistinct(expectedKeys, 'round_items');
  requireDistinct(canonicalOrder, 'correct_order');
  requireDistinct(submittedOrder, 'submitted_order');

  if (canonicalOrder.length !== expectedKeys.length || submittedOrder.length !== expectedKeys.length) {
    throw new Error('round_or_submission_length_mismatch');
  }

  ensureSameMembers(expectedKeys, canonicalOrder);
  ensureSameMembers(expectedKeys, submittedOrder);

  const positionsCorrect = submittedOrder.map((key, index) => key === canonicalOrder[index]);
  const roundScore = positionsCorrect.filter(Boolean).length;

  return {
    positionsCorrect,
    roundScore,
    canonicalOrder,
    reveal: orderReveal(canonicalOrder, round.reveal)
  };
}
