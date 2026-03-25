import { describe, expect, it } from 'vitest';
import { buildRevealTimeline } from '../game/reveal-timeline';

describe('buildRevealTimeline', () => {
  it('reorders deterministically toward canonical order', () => {
    const timeline = buildRevealTimeline(['d', 'c', 'b', 'a'], ['a', 'b', 'c', 'd']);

    expect(timeline.steps).toHaveLength(3);
    expect(timeline.steps[0].order).toEqual(['a', 'd', 'c', 'b']);
    expect(timeline.steps[1].order).toEqual(['a', 'b', 'd', 'c']);
    expect(timeline.steps[2].order).toEqual(['a', 'b', 'c', 'd']);
  });

  it('starts metadata after reorder color stage', () => {
    const timeline = buildRevealTimeline(['d', 'c', 'b', 'a'], ['a', 'b', 'c', 'd']);

    expect(timeline.steps[0].delayMs).toBeGreaterThan(timeline.colorAtMs);
    expect(timeline.detailsStartAtMs).toBeGreaterThan(timeline.colorAtMs);
    expect(timeline.detailsStartAtMs).toBeGreaterThan(timeline.steps[timeline.steps.length - 1].delayMs);
    expect(timeline.totalMs).toBeGreaterThan(timeline.detailsStartAtMs);
  });

  it('returns no steps when submission is already canonical', () => {
    const timeline = buildRevealTimeline(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']);

    expect(timeline.steps).toHaveLength(0);
    expect(timeline.colorAtMs).toBe(160);
  });
});
