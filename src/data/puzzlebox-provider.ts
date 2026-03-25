import type { DriftRound, DriftRevealEntry } from '../game/types';
import type { DriftProvider } from './provider';
import { PuzzleboxClient, type TodayRoundPayload } from './puzzlebox-client';

interface CreatePuzzleboxProviderInput {
  baseUrl: string;
  tenant: string;
  gameSlug: string;
}

function requireString(value: unknown, errorCode: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(errorCode);
  }
  return value;
}

function parseReveal(value: unknown, roundId: string, source: 'today' | 'respond'): DriftRevealEntry[] {
  if (!Array.isArray(value)) {
    throw new Error(`missing_metadata_reveal:${source}:${roundId}`);
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`invalid_reveal_entry:${source}:${roundId}:${index}`);
    }

    return {
      key: requireString((entry as Record<string, unknown>).key, `invalid_reveal_key:${source}:${roundId}:${index}`),
      year: requireString((entry as Record<string, unknown>).year, `invalid_reveal_year:${source}:${roundId}:${index}`),
      description: requireString(
        (entry as Record<string, unknown>).description,
        `invalid_reveal_description:${source}:${roundId}:${index}`
      )
    };
  });
}

function orderReveal(canonicalOrder: string[], reveal: DriftRevealEntry[], roundId: string): DriftRevealEntry[] {
  const map = new Map(reveal.map((entry) => [entry.key, entry]));
  return canonicalOrder.map((key) => {
    const entry = map.get(key);
    if (!entry) throw new Error(`missing_reveal_key_for_canonical_order:${roundId}:${key}`);
    return entry;
  });
}

function normalizeTodayRound(input: TodayRoundPayload): DriftRound {
  const metadata = input.metadata;
  if (!metadata || typeof metadata !== 'object') {
    throw new Error(`missing_round_metadata:today:${input.id}`);
  }

  const theme = requireString((metadata as Record<string, unknown>).theme, `missing_metadata_theme:today:${input.id}`);
  const reveal = parseReveal((metadata as Record<string, unknown>).reveal, input.id, 'today');

  return {
    id: input.id,
    theme,
    prompt: input.prompt,
    items: input.options.map((option) => ({ key: option.key, label: option.label })),
    correctOrder: reveal.map((entry) => entry.key),
    reveal
  };
}

export function createPuzzleboxProvider(input: CreatePuzzleboxProviderInput): DriftProvider {
  const client = new PuzzleboxClient({
    baseUrl: input.baseUrl,
    tenant: input.tenant
  });

  return {
    async loadSession() {
      await client.authAnonymous(Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
      const today = await client.getToday(input.gameSlug);

      if (!Array.isArray(today.rounds)) {
        throw new Error('today_payload_missing_rounds');
      }

      const rounds = today.rounds.map(normalizeTodayRound);

      if (rounds.length !== 5) {
        throw new Error('api_today_payload_must_include_exactly_5_rounds');
      }

      let sessionRef: string;
      if (today.existing_session?.id) {
        sessionRef = today.existing_session.id;
      } else {
        const session = await client.startSession(today.edition_id);
        sessionRef = session.session_id;
      }

      return {
        rounds,
        sessionRef
      };
    },

    async submitRound({ round, order, sessionRef }) {
      if (!sessionRef) throw new Error('missing_session_reference_for_api_submit');

      const payload = await client.respond(sessionRef, {
        round_id: round.id,
        answer: { order }
      });

      if (!Array.isArray(payload.positions_correct)) {
        throw new Error(`missing_positions_correct:${round.id}`);
      }

      const positionsCorrect = payload.positions_correct.map((value, index) => {
        if (typeof value !== 'boolean') {
          throw new Error(`invalid_positions_correct:${round.id}:${index}`);
        }
        return value;
      });

      const scoreFromResponse = typeof payload.score === 'number' ? payload.score : positionsCorrect.filter(Boolean).length;
      const canonicalOrderRaw = payload.correct_answer?.order;
      const canonicalOrder = Array.isArray(canonicalOrderRaw) ? canonicalOrderRaw.map(String) : round.correctOrder;

      if (canonicalOrder.length !== round.items.length) {
        throw new Error(`invalid_canonical_order_length:${round.id}`);
      }

      const metadata = payload.metadata;
      const revealFromResponse =
        metadata && typeof metadata === 'object' ? parseReveal((metadata as Record<string, unknown>).reveal, round.id, 'respond') : round.reveal;

      return {
        positionsCorrect,
        roundScore: scoreFromResponse,
        canonicalOrder,
        reveal: orderReveal(canonicalOrder, revealFromResponse, round.id)
      };
    },

    async completeSession(sessionRef) {
      if (!sessionRef) return;
      await client.completeSession(sessionRef);
    }
  };
}
