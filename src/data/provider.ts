import { makeSessionSeed } from '../game/seed';
import type { DriftRound } from '../game/types';
import { createFixtureProvider } from './fixture-provider';
import { createPuzzleboxProvider } from './puzzlebox-provider';

export type DriftDataSource = 'fixture' | 'api';

export interface DriftProvider {
  loadSession(seed: string): Promise<{ rounds: DriftRound[]; sessionRef?: string }>;
  submitRound(input: {
    round: DriftRound;
    order: string[];
    sessionRef?: string;
  }): Promise<{
    positionsCorrect: boolean[];
    roundScore: number;
    canonicalOrder: string[];
    reveal: DriftRound['reveal'];
  }>;
  completeSession?(sessionRef?: string): Promise<void>;
}

export interface RuntimeConfig {
  source: DriftDataSource;
  seed: string;
  gameSlug: string;
  apiBaseUrl?: string;
  apiTenant?: string;
  testMode: boolean;
}

interface ResolveConfigInput {
  search?: string;
  env?: Record<string, string | undefined>;
  seedFactory?: () => string;
}

function parseSource(value: string | null | undefined): DriftDataSource {
  return value === 'api' ? 'api' : 'fixture';
}

export function resolveRuntimeConfig(input: ResolveConfigInput = {}): RuntimeConfig {
  const env = input.env ?? (import.meta.env as Record<string, string | undefined>);
  const search = input.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);

  const testMode = params.get('test') === '1';
  const sourceFromEnv = parseSource(env.VITE_DRIFT_DATA_SOURCE);
  const sourceFromParam = parseSource(params.get('source'));
  const source = testMode ? 'fixture' : params.has('source') ? sourceFromParam : sourceFromEnv;

  const seedFactory = input.seedFactory ?? makeSessionSeed;
  const seed = params.get('seed') ?? env.VITE_DRIFT_SEED ?? (testMode ? 'drift-test-seed' : seedFactory());

  return {
    source,
    seed,
    gameSlug: env.VITE_PUZZLEBOX_GAME_SLUG ?? 'drift',
    apiBaseUrl: env.VITE_PUZZLEBOX_BASE_URL,
    apiTenant: env.VITE_PUZZLEBOX_TENANT,
    testMode
  };
}

export function createProvider(config: RuntimeConfig): DriftProvider {
  if (config.source === 'api') {
    if (!config.apiBaseUrl || !config.apiTenant) {
      throw new Error('api_mode_requires_VITE_PUZZLEBOX_BASE_URL_and_VITE_PUZZLEBOX_TENANT');
    }

    return createPuzzleboxProvider({
      baseUrl: config.apiBaseUrl,
      tenant: config.apiTenant,
      gameSlug: config.gameSlug
    });
  }

  return createFixtureProvider();
}
