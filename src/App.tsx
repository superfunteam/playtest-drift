import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { RoundBoard } from './components/RoundBoard';
import { SessionSummary } from './components/SessionSummary';
import { StateNotice } from './components/StateNotice';
import { TopBar } from './components/TopBar';
import { createProvider, resolveRuntimeConfig, type DriftProvider, type RuntimeConfig } from './data/provider';
import { deterministicShuffle, makeSessionSeed, seedForRound } from './game/seed';
import { canSubmit, initialSessionState, sessionReducer } from './game/session-state';
import type { DriftRound, UserPrefs } from './game/types';

interface AppProps {
  runtimeOverride?: RuntimeConfig;
  providerOverride?: DriftProvider;
}

const SOUND_PREF_KEY = 'drift:sound-enabled';

function buildRoundStartOrders(rounds: DriftRound[], seed: string): Record<string, string[]> {
  return Object.fromEntries(
    rounds.map((round) => [round.id, deterministicShuffle(round.items.map((item) => item.key), seedForRound(seed, round.id))])
  );
}

function syncUrlConfig(config: RuntimeConfig): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  params.set('seed', config.seed);

  if (config.source === 'api') {
    params.set('source', 'api');
  } else {
    params.delete('source');
  }

  if (config.testMode) {
    params.set('test', '1');
  } else {
    params.delete('test');
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown_error';
}

function loadUserPrefs(): UserPrefs {
  if (typeof window === 'undefined') {
    return { soundEnabled: true };
  }

  try {
    const value = window.localStorage.getItem(SOUND_PREF_KEY);
    if (!value) return { soundEnabled: true };
    return {
      soundEnabled: value === '1'
    };
  } catch {
    return { soundEnabled: true };
  }
}

function saveUserPrefs(prefs: UserPrefs): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SOUND_PREF_KEY, prefs.soundEnabled ? '1' : '0');
  } catch {
    return;
  }
}

export function App({ runtimeOverride, providerOverride }: AppProps) {
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>(() => runtimeOverride ?? resolveRuntimeConfig());
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs());
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [sessionIteration, setSessionIteration] = useState(0);
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const completionMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    saveUserPrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (runtimeOverride) {
      setRuntimeConfig(runtimeOverride);
    }
  }, [runtimeOverride]);

  useEffect(() => {
    if (!runtimeOverride) {
      syncUrlConfig(runtimeConfig);
    }
  }, [runtimeConfig, runtimeOverride]);

  useEffect(() => {
    setShowIntroModal(true);
  }, [runtimeConfig.seed, sessionIteration]);

  const providerState = useMemo(() => {
    if (providerOverride) {
      return { provider: providerOverride, providerError: null as string | null };
    }

    try {
      return { provider: createProvider(runtimeConfig), providerError: null as string | null };
    } catch (error) {
      return { provider: null, providerError: errorMessage(error) };
    }
  }, [providerOverride, runtimeConfig]);

  useEffect(() => {
    let active = true;
    dispatch({ type: 'BOOT_START', seed: runtimeConfig.seed });

    if (providerState.providerError || !providerState.provider) {
      dispatch({
        type: 'BOOT_ERROR',
        message: providerState.providerError ?? 'provider_initialization_failed'
      });
      return () => {
        active = false;
      };
    }

    const activeProvider = providerState.provider;

    async function boot() {
      try {
        const payload = await activeProvider.loadSession(runtimeConfig.seed);
        if (!active) return;

        dispatch({
          type: 'BOOT_SUCCESS',
          seed: runtimeConfig.seed,
          rounds: payload.rounds,
          roundStartOrders: buildRoundStartOrders(payload.rounds, runtimeConfig.seed),
          sessionRef: payload.sessionRef
        });
      } catch (error) {
        if (!active) return;
        dispatch({ type: 'BOOT_ERROR', message: errorMessage(error) });
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, [providerState.provider, providerState.providerError, runtimeConfig.seed, sessionIteration]);

  useEffect(() => {
    if (state.phase !== 'complete') return;

    const marker = `${state.seed}:${state.sessionRef ?? 'fixture'}`;
    if (completionMarkerRef.current === marker) return;

    completionMarkerRef.current = marker;
    if (!providerState.provider) return;
    void providerState.provider.completeSession?.(state.sessionRef);
  }, [providerState.provider, state.phase, state.seed, state.sessionRef]);

  const currentRound = state.rounds[state.currentRoundIndex] ?? null;
  const labelByKey = useMemo(() => new Map((currentRound?.items ?? []).map((item) => [item.key, item.label])), [currentRound]);

  useEffect(() => {
    if (state.currentOrder.length === 0) return;
    const orderText = state.currentOrder.map((key) => labelByKey.get(key) ?? key).join(' -> ');
    console.log(`[Drift Debug] Current Order: ${orderText}`);
  }, [state.currentOrder, labelByKey]);

  async function handleSubmit(submittedOrderInput: string[]) {
    if (!providerState.provider || !currentRound || !canSubmit(state)) return;

    const submittedOrder = submittedOrderInput.slice();
    dispatch({ type: 'REORDER', order: submittedOrder });
    dispatch({ type: 'SUBMIT_REQUEST' });

    try {
      const evaluation = await providerState.provider.submitRound({
        round: currentRound,
        order: submittedOrder,
        sessionRef: state.sessionRef
      });

      dispatch({ type: 'SUBMIT_SUCCESS', submittedOrder, evaluation });
    } catch (error) {
      dispatch({ type: 'SUBMIT_FAILURE', message: errorMessage(error) });
    }
  }

  function restartSameSeed() {
    completionMarkerRef.current = null;
    setSessionIteration((value) => value + 1);
  }

  function restartNewSeed() {
    completionMarkerRef.current = null;
    const seed = makeSessionSeed();
    setRuntimeConfig((current) => ({
      ...current,
      seed,
      source: current.testMode ? 'fixture' : current.source
    }));
    setSessionIteration((value) => value + 1);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>Drift</h1>
        <TopBar
          runningScore={state.runningScore}
          soundEnabled={prefs.soundEnabled}
          onToggleSound={() => {
            setPrefs((current) => ({
              soundEnabled: !current.soundEnabled
            }));
          }}
        />
      </header>

      {state.error && <StateNotice title="Heads Up" message={state.error} tone="error" />}

      {state.phase === 'booting' && (
        <StateNotice title="Loading Rounds" message="Building a five-round Drift session..." />
      )}

      {state.phase === 'error' && (
        <StateNotice
          title="Could Not Start Session"
          message="Check runtime config and refresh. In API mode this can happen when metadata is missing."
          tone="error"
        />
      )}

      {showIntroModal && state.phase !== 'booting' && state.phase !== 'error' && (
        <div className="intro-modal-backdrop" role="presentation">
          <section className="intro-modal card" role="dialog" aria-modal="true" aria-labelledby="intro-title">
            <h2 id="intro-title">How to Play</h2>
            <ol className="intro-modal__steps">
              <li>Drag the four words into oldest-to-newest order.</li>
              <li>Tap Submit once to lock your guess for this round.</li>
              <li>Review the reveal and use it to improve next round.</li>
            </ol>
            <button type="button" className="primary-button" onClick={() => setShowIntroModal(false)}>
              Start Game
            </button>
          </section>
        </div>
      )}

      {currentRound && !showIntroModal && (state.phase === 'playing' || state.phase === 'revealing') && (
        <RoundBoard
          key={currentRound.id}
          roundId={currentRound.id}
          theme={currentRound.theme}
          prompt={currentRound.prompt}
          order={state.currentOrder}
          items={currentRound.items}
          phase={state.phase}
          isSubmitting={state.isSubmitting}
          result={state.currentResult}
          isLastRound={state.currentRoundIndex >= state.rounds.length - 1}
          soundEnabled={prefs.soundEnabled}
          onOrderChange={(nextOrder) => dispatch({ type: 'REORDER', order: nextOrder })}
          onSubmit={handleSubmit}
          onContinue={() => dispatch({ type: 'ADVANCE_ROUND' })}
        />
      )}

      {state.phase === 'complete' && (
        <SessionSummary
          rounds={state.rounds}
          results={state.roundResults}
          score={state.runningScore}
          maxScore={state.rounds.length * 4}
          seed={state.seed}
          onReplaySameSeed={restartSameSeed}
          onReplayNewSeed={restartNewSeed}
        />
      )}
    </main>
  );
}
