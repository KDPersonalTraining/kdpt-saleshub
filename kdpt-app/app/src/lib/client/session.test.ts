import { describe, expect, it } from 'vitest';
import { clock, elapsedMs, nextSetIndex, stepLoad, stepReps } from './session';

describe('workout clock', () => {
  it('leaves out time spent paused', () => {
    expect(elapsedMs({ startedAt: 0, pausedMs: 60_000, pausedAt: null }, 600_000)).toBe(540_000);
    expect(elapsedMs({ startedAt: 0, pausedMs: 0, pausedAt: 500_000 }, 600_000)).toBe(500_000);
  });
  it('is zero before starting', () => { expect(elapsedMs({ startedAt: null, pausedMs: 0, pausedAt: null }, 5)).toBe(0); });
  it('formats minutes and hours', () => { expect(clock(65_000)).toBe('1:05'); expect(clock(3_725_000)).toBe('1:02:05'); });
});

describe('steppers', () => {
  it('move weight by the load jump within limits', () => {
    expect(stepLoad('120', 10)).toBe('130');
    expect(stepLoad('57.5', 2.5)).toBe('60');
    expect(stepLoad('2', -2.5)).toBe('0');
    expect(stepLoad('499', 2.5)).toBe('500');
    expect(stepLoad('abc', 2.5)).toBe('2.5');
  });
  it('move reps by one within limits', () => {
    expect(stepReps('10', 1)).toBe('11');
    expect(stepReps('1', -1)).toBe('1');
    expect(stepReps('', 1)).toBe('1');
    expect(stepReps('100', 1)).toBe('100');
  });
  it('finds the next set to log', () => {
    expect(nextSetIndex([{ done: true }, { done: false }])).toBe(1);
    expect(nextSetIndex([{ done: true }])).toBeNull();
  });
});
