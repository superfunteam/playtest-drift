export interface DriftItem {
  key: string;
  label: string;
}

export interface DriftRevealEntry {
  key: string;
  year: string;
  description: string;
}

export interface DriftRound {
  id: string;
  theme: string;
  prompt: string;
  items: DriftItem[];
  correctOrder: string[];
  reveal: DriftRevealEntry[];
}

export interface RoundEvaluation {
  positionsCorrect: boolean[];
  roundScore: number;
  canonicalOrder: string[];
  reveal: DriftRevealEntry[];
}

export type GamePhase = 'booting' | 'playing' | 'revealing' | 'complete' | 'error';

export interface RoundResult {
  roundId: string;
  submittedOrder: string[];
  positionsCorrect: boolean[];
  roundScore: number;
  canonicalOrder: string[];
  reveal: DriftRevealEntry[];
}

export interface RoundUIState {
  displayOrder: string[];
  revealStep: number;
  detailsVisible: number;
  triviaOpen: string[];
  isSubmitLocked: boolean;
}

export interface UserPrefs {
  soundEnabled: boolean;
}
