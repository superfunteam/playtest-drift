import roundsJson from '../content/drift-rounds.json';
import { evaluateRound } from '../game/engine';
import type { DriftRound } from '../game/types';
import type { DriftProvider } from './provider';

interface FixtureRound {
  id: string;
  theme: string;
  prompt: string;
  items: Array<{ key: string; label: string }>;
  correct_order: string[];
  reveal: Array<{ key: string; year: string; description: string }>;
}

function normalizeRound(input: FixtureRound): DriftRound {
  return {
    id: input.id,
    theme: input.theme,
    prompt: input.prompt,
    items: input.items.map((item) => ({ key: item.key, label: item.label })),
    correctOrder: input.correct_order.slice(),
    reveal: input.reveal.map((entry) => ({
      key: entry.key,
      year: entry.year,
      description: entry.description
    }))
  };
}

function loadFixtureRounds(): DriftRound[] {
  const normalized = (roundsJson as FixtureRound[]).map(normalizeRound);

  if (normalized.length !== 5) {
    throw new Error('fixture_content_must_include_exactly_5_rounds');
  }

  for (const round of normalized) {
    if (round.items.length !== 4) {
      throw new Error(`fixture_round_requires_4_items:${round.id}`);
    }
  }

  return normalized;
}

export function createFixtureProvider(): DriftProvider {
  return {
    async loadSession() {
      return {
        rounds: loadFixtureRounds()
      };
    },

    async submitRound({ round, order }) {
      return evaluateRound(round, order);
    },

    async completeSession() {
      return;
    }
  };
}
