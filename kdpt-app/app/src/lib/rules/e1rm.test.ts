import { describe, expect, it } from 'vitest';
import { bestSet, estimateOneRepMax } from './e1rm';

describe('estimateOneRepMax', () => {
  it('uses Epley', () => {
    expect(estimateOneRepMax(100, 10)).toBe(133.3);
    expect(estimateOneRepMax(130, 10)).toBe(173.3);
  });
  it('returns the load itself for a single', () => {
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });
  it('refuses estimates it cannot trust', () => {
    expect(estimateOneRepMax(40, 15)).toBeNull();
    expect(estimateOneRepMax(0, 10)).toBeNull();
    expect(estimateOneRepMax(60, 0)).toBeNull();
    expect(estimateOneRepMax(60, 2.5)).toBeNull();
  });
});

describe('bestSet', () => {
  it('picks the set with the highest estimate', () => {
    const sets = [{ load: 120, reps: 12 }, { load: 130, reps: 10 }, { load: 130, reps: 9 }];
    expect(bestSet(sets)).toEqual({ load: 130, reps: 10 });
  });
  it('is null when nothing can be estimated', () => {
    expect(bestSet([{ load: 0, reps: 10 }])).toBeNull();
    expect(bestSet([])).toBeNull();
  });
});
