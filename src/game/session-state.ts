import type { DriftRound, GamePhase, RoundEvaluation, RoundResult } from './types';

export interface SessionState {
  phase: GamePhase;
  rounds: DriftRound[];
  roundStartOrders: Record<string, string[]>;
  currentRoundIndex: number;
  currentOrder: string[];
  runningScore: number;
  roundResults: RoundResult[];
  currentResult: RoundResult | null;
  seed: string;
  sessionRef?: string;
  error: string | null;
  isSubmitting: boolean;
}

export type SessionAction =
  | { type: 'BOOT_START'; seed: string }
  | {
      type: 'BOOT_SUCCESS';
      seed: string;
      rounds: DriftRound[];
      roundStartOrders: Record<string, string[]>;
      sessionRef?: string;
    }
  | { type: 'BOOT_ERROR'; message: string }
  | { type: 'REORDER'; order: string[] }
  | { type: 'SUBMIT_REQUEST' }
  | {
      type: 'SUBMIT_SUCCESS';
      submittedOrder: string[];
      evaluation: RoundEvaluation;
    }
  | { type: 'SUBMIT_FAILURE'; message: string }
  | { type: 'ADVANCE_ROUND' };

export const initialSessionState: SessionState = {
  phase: 'booting',
  rounds: [],
  roundStartOrders: {},
  currentRoundIndex: 0,
  currentOrder: [],
  runningScore: 0,
  roundResults: [],
  currentResult: null,
  seed: '',
  sessionRef: undefined,
  error: null,
  isSubmitting: false
};

function getRoundStartOrder(
  rounds: DriftRound[],
  roundStartOrders: Record<string, string[]>,
  roundIndex: number
): string[] {
  const round = rounds[roundIndex];
  if (!round) return [];
  return roundStartOrders[round.id]?.slice() ?? round.items.map((item) => item.key);
}

function makeRoundResult(roundId: string, submittedOrder: string[], evaluation: RoundEvaluation): RoundResult {
  return {
    roundId,
    submittedOrder: submittedOrder.slice(),
    positionsCorrect: evaluation.positionsCorrect.slice(),
    roundScore: evaluation.roundScore,
    canonicalOrder: evaluation.canonicalOrder.slice(),
    reveal: evaluation.reveal.slice()
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'BOOT_START':
      return {
        ...initialSessionState,
        seed: action.seed
      };

    case 'BOOT_SUCCESS':
      return {
        ...initialSessionState,
        phase: 'playing',
        rounds: action.rounds,
        roundStartOrders: action.roundStartOrders,
        currentOrder: getRoundStartOrder(action.rounds, action.roundStartOrders, 0),
        seed: action.seed,
        sessionRef: action.sessionRef
      };

    case 'BOOT_ERROR':
      return {
        ...state,
        phase: 'error',
        error: action.message,
        isSubmitting: false
      };

    case 'REORDER':
      if (state.phase !== 'playing' || state.isSubmitting) return state;
      return {
        ...state,
        currentOrder: action.order.slice()
      };

    case 'SUBMIT_REQUEST':
      if (state.phase !== 'playing' || state.isSubmitting) return state;
      return {
        ...state,
        phase: 'revealing',
        isSubmitting: true,
        error: null
      };

    case 'SUBMIT_SUCCESS': {
      if (state.phase !== 'revealing' || !state.isSubmitting) return state;
      const currentRound = state.rounds[state.currentRoundIndex];
      if (!currentRound) return state;

      const roundResult = makeRoundResult(currentRound.id, action.submittedOrder, action.evaluation);
      return {
        ...state,
        isSubmitting: false,
        currentResult: roundResult,
        runningScore: state.runningScore + action.evaluation.roundScore,
        roundResults: [...state.roundResults, roundResult]
      };
    }

    case 'SUBMIT_FAILURE':
      if (state.phase !== 'revealing') return state;
      return {
        ...state,
        phase: 'playing',
        isSubmitting: false,
        error: action.message
      };

    case 'ADVANCE_ROUND': {
      if (state.phase !== 'revealing' || state.isSubmitting || !state.currentResult) return state;

      const isLastRound = state.currentRoundIndex >= state.rounds.length - 1;
      if (isLastRound) {
        return {
          ...state,
          phase: 'complete'
        };
      }

      const nextRoundIndex = state.currentRoundIndex + 1;
      return {
        ...state,
        phase: 'playing',
        currentRoundIndex: nextRoundIndex,
        currentOrder: getRoundStartOrder(state.rounds, state.roundStartOrders, nextRoundIndex),
        currentResult: null,
        error: null
      };
    }

    default:
      return state;
  }
}

export function canReorder(state: SessionState): boolean {
  return state.phase === 'playing' && !state.isSubmitting;
}

export function canSubmit(state: SessionState): boolean {
  return state.phase === 'playing' && !state.isSubmitting;
}
