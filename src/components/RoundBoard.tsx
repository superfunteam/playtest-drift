import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  defaultAnimateLayoutChanges,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { playRevealTone } from '../game/audio';
import { buildRevealTimeline } from '../game/reveal-timeline';
import type { DriftItem, RoundResult, RoundUIState } from '../game/types';

interface RoundBoardProps {
  roundId: string;
  theme: string;
  prompt: string;
  order: string[];
  items: DriftItem[];
  phase: 'playing' | 'revealing';
  isSubmitting: boolean;
  result: RoundResult | null;
  isLastRound: boolean;
  soundEnabled: boolean;
  onOrderChange: (nextOrder: string[]) => void;
  onSubmit: (submittedOrder: string[]) => void;
  onContinue: () => void;
}

interface SortableCardProps {
  id: string;
  label: string;
  disabled: boolean;
  index: number;
  year: string;
  triviaText: string;
  detailsVisible: boolean;
  triviaOpen: boolean;
  resultTone: 'correct' | 'wrong' | null;
  onToggleTrivia: () => void;
}

function makeRoundUIState(order: string[], isSubmitLocked: boolean): RoundUIState {
  return {
    displayOrder: order.slice(),
    revealStep: 0,
    detailsVisible: -1,
    triviaOpen: [],
    isSubmitLocked
  };
}

function buildOutcomeMap(result: RoundResult | null): Map<string, boolean> {
  if (!result) return new Map();
  return new Map(result.canonicalOrder.map((key, index) => [key, result.positionsCorrect[index] ?? false]));
}

function buildRevealMap(result: RoundResult | null): Map<string, RoundResult['reveal'][number]> {
  if (!result) return new Map();
  return new Map(result.reveal.map((entry) => [entry.key, entry]));
}

function SortableCard({
  id,
  label,
  disabled,
  index,
  year,
  triviaText,
  detailsVisible,
  triviaOpen,
  resultTone,
  onToggleTrivia
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.2, 0.86, 0.2, 1)'
    },
    animateLayoutChanges: defaultAnimateLayoutChanges
  });

  const driftOffset = `${index * 12}px`;
  const combinedTransition = transition ? `${transition}, margin-left 300ms ease` : 'margin-left 300ms ease';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: combinedTransition,
    ['--drift-offset' as string]: driftOffset
  } as CSSProperties;

  const rowClass = [
    'drift-row',
    resultTone === 'correct' ? 'drift-row--correct' : '',
    resultTone === 'wrong' ? 'drift-row--wrong' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li ref={setNodeRef} style={style} className={rowClass}>
      <div className={`drift-card ${disabled ? 'drift-card--locked' : ''}`} {...attributes} {...listeners}>
        <div className="drift-card__main">
          <span className="drift-card__grab" aria-hidden="true">
            ::
          </span>
          <span className="drift-card__label">{label}</span>
        </div>

        <div className={`drift-card__meta ${detailsVisible ? 'drift-card__meta--visible' : ''}`}>
          <span className="year-pill">{year}</span>
          <button
            type="button"
            className="trivia-chip"
            onClick={(event) => {
              event.stopPropagation();
              onToggleTrivia();
            }}
            disabled={!detailsVisible}
          >
            {triviaOpen ? 'Hide' : 'Trivia'}
          </button>
        </div>
      </div>

      <div className={`trivia-panel ${triviaOpen ? 'trivia-panel--open' : ''}`}>
        <p>{triviaText}</p>
      </div>
    </li>
  );
}

export function RoundBoard({
  roundId,
  theme,
  prompt,
  order,
  items,
  phase,
  isSubmitting,
  result,
  isLastRound,
  soundEnabled,
  onOrderChange,
  onSubmit,
  onContinue
}: RoundBoardProps) {
  const [uiState, setUiState] = useState<RoundUIState>(() => makeRoundUIState(order, phase !== 'playing'));
  const [showResultColors, setShowResultColors] = useState(false);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);
  const displayOrderRef = useRef(order.slice());

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (phase !== 'playing') return;

    displayOrderRef.current = order.slice();
    setIsDragging(false);
    setUiState(makeRoundUIState(order, false));
    setShowResultColors(false);
    setIsRevealComplete(false);
  }, [phase, roundId]);

  useEffect(() => {
    if (phase !== 'revealing') return;

    setIsDragging(false);
    setUiState((current) => ({
      ...current,
      isSubmitLocked: true
    }));

    if (!result) return;

    displayOrderRef.current = result.submittedOrder.slice();
    setUiState(makeRoundUIState(result.submittedOrder, true));
    setShowResultColors(false);
    setIsRevealComplete(false);

    const timeline = buildRevealTimeline(result.submittedOrder, result.canonicalOrder);
    const timerIds: number[] = [];

    timeline.steps.forEach((step, index) => {
      const timerId = window.setTimeout(() => {
        displayOrderRef.current = step.order.slice();
        setUiState((current) => ({
          ...current,
          displayOrder: step.order.slice(),
          revealStep: index + 1
        }));

        if (soundEnabledRef.current) {
          void playRevealTone(Boolean(result.positionsCorrect[step.landedIndex]), true);
        }
      }, step.delayMs);

      timerIds.push(timerId);
    });

    timerIds.push(
      window.setTimeout(() => {
        setShowResultColors(true);
      }, timeline.colorAtMs)
    );

    result.canonicalOrder.forEach((_, index) => {
      timerIds.push(
        window.setTimeout(() => {
          setUiState((current) => ({
            ...current,
            detailsVisible: index
          }));
        }, timeline.detailsStartAtMs + index * timeline.detailsStaggerMs)
      );
    });

    timerIds.push(
      window.setTimeout(() => {
        setIsRevealComplete(true);
      }, timeline.totalMs)
    );

    return () => {
      for (const timerId of timerIds) {
        window.clearTimeout(timerId);
      }
    };
  }, [phase, result, roundId]);

  const labels = useMemo(() => new Map(items.map((item) => [item.key, item.label])), [items]);
  const outcomeMap = useMemo(() => buildOutcomeMap(result), [result]);
  const revealMap = useMemo(() => buildRevealMap(result), [result]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 110,
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent): void {
    setIsDragging(false);
    if (phase !== 'playing' || uiState.isSubmitLocked) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentOrder = displayOrderRef.current;
    const oldIndex = currentOrder.indexOf(String(active.id));
    const newIndex = currentOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(currentOrder, oldIndex, newIndex);
    displayOrderRef.current = nextOrder;
    setUiState((current) => ({
      ...current,
      displayOrder: nextOrder
    }));
    onOrderChange(nextOrder);
  }

  function handleSubmit(): void {
    if (phase !== 'playing' || uiState.isSubmitLocked || isSubmitting || isDragging) return;

    const submittedOrder = displayOrderRef.current.slice();
    setUiState((current) => ({
      ...current,
      isSubmitLocked: true
    }));
    onSubmit(submittedOrder);
  }

  function toggleTrivia(key: string, detailsVisible: boolean): void {
    if (!detailsVisible) return;

    setUiState((current) => {
      const isOpen = current.triviaOpen.includes(key);
      return {
        ...current,
        triviaOpen: isOpen ? current.triviaOpen.filter((value) => value !== key) : [...current.triviaOpen, key]
      };
    });
  }

  const helperText =
    phase === 'playing'
      ? 'Drag to sort from oldest to newest.'
      : isSubmitting || !result
        ? 'Checking your order...'
        : !showResultColors
          ? 'Drifting words into canonical order...'
          : 'Years are showing. Tap Trivia for context.';

  return (
    <section className="card board board--swipe-in">
      <p className="board__theme">{theme}</p>
      <h2>{prompt}</h2>
      <p className="board__hint">{helperText}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragCancel={() => {
          setIsDragging(false);
        }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={uiState.displayOrder} strategy={verticalListSortingStrategy}>
          <ol className="drift-list" aria-label="Sortable words">
            {uiState.displayOrder.map((key, index) => {
              const reveal = revealMap.get(key);
              const detailsVisible = phase === 'revealing' && uiState.detailsVisible >= index;
              const isCorrect = outcomeMap.get(key) ?? false;
              const resultTone = showResultColors ? (isCorrect ? 'correct' : 'wrong') : null;

              return (
                <SortableCard
                  key={key}
                  id={key}
                  label={labels.get(key) ?? key}
                  disabled={phase !== 'playing' || uiState.isSubmitLocked}
                  index={index}
                  year={reveal?.year ?? ''}
                  triviaText={reveal?.description ?? ''}
                  detailsVisible={detailsVisible}
                  triviaOpen={uiState.triviaOpen.includes(key)}
                  resultTone={resultTone}
                  onToggleTrivia={() => toggleTrivia(key, detailsVisible)}
                />
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>

      {phase === 'playing' ? (
        <button
          type="button"
          className="primary-button"
          onClick={handleSubmit}
          disabled={uiState.isSubmitLocked || isSubmitting || isDragging}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>
      ) : (
        <button type="button" className="primary-button" onClick={onContinue} disabled={!isRevealComplete || isSubmitting || !result}>
          {isSubmitting || !result ? 'Checking...' : isRevealComplete ? (isLastRound ? 'See Final Score' : 'Next Round') : 'Revealing...'}
        </button>
      )}
    </section>
  );
}
