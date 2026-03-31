export interface RevealTimelineStep {
  order: string[];
  landedIndex: number;
  delayMs: number;
}

export interface RevealTimeline {
  steps: RevealTimelineStep[];
  colorAtMs: number;
  detailsStartAtMs: number;
  detailsStaggerMs: number;
  totalMs: number;
}

export interface RevealTimelineConfig {
  initialDelayMs: number;
  colorLeadMs: number;
  stepMs: number;
  settleMs: number;
  detailsStaggerMs: number;
}

const DEFAULT_CONFIG: RevealTimelineConfig = {
  initialDelayMs: 160,
  colorLeadMs: 360,
  stepMs: 520,
  settleMs: 480,
  detailsStaggerMs: 110
};

interface RawStep {
  order: string[];
  landedIndex: number;
}

function nextStep(currentOrder: string[], canonicalOrder: string[]): RawStep | null {
  for (let index = 0; index < canonicalOrder.length; index += 1) {
    if (currentOrder[index] === canonicalOrder[index]) continue;

    const fromIndex = currentOrder.indexOf(canonicalOrder[index]);
    if (fromIndex < 0) return null;

    const nextOrder = currentOrder.slice();
    const [movedKey] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(index, 0, movedKey);

    return {
      order: nextOrder,
      landedIndex: index
    };
  }

  return null;
}

function buildRawSteps(submittedOrder: string[], canonicalOrder: string[]): RawStep[] {
  const steps: RawStep[] = [];
  let currentOrder = submittedOrder.slice();

  while (true) {
    const step = nextStep(currentOrder, canonicalOrder);
    if (!step) break;
    steps.push(step);
    currentOrder = step.order;
  }

  return steps;
}

export function buildRevealTimeline(
  submittedOrder: string[],
  canonicalOrder: string[],
  config: Partial<RevealTimelineConfig> = {}
): RevealTimeline {
  const values = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const colorAtMs = values.initialDelayMs;
  const movementStartAtMs = colorAtMs + values.colorLeadMs;
  const steps = buildRawSteps(submittedOrder, canonicalOrder).map((step, index) => ({
    ...step,
    delayMs: movementStartAtMs + index * values.stepMs
  }));

  const movementEndAtMs =
    steps.length > 0 ? movementStartAtMs + (steps.length - 1) * values.stepMs + values.settleMs : colorAtMs + values.settleMs;
  const detailsStartAtMs = movementEndAtMs + 70;
  const totalMs = detailsStartAtMs + Math.max(0, canonicalOrder.length - 1) * values.detailsStaggerMs + 120;

  return {
    steps,
    colorAtMs,
    detailsStartAtMs,
    detailsStaggerMs: values.detailsStaggerMs,
    totalMs
  };
}
