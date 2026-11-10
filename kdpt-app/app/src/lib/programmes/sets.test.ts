import { describe, expect, it } from 'vitest';
import { cleanPlan, firstStep, setLoad, setsOf } from './sets';

describe('set plans', () => {
  it('fills in identical sets when there is no plan', () => {
    expect(setsOf(3, [8, 10], null)).toEqual([{ kind: 'working', reps: [8, 10] }, { kind: 'working', reps: [8, 10] }, { kind: 'working', reps: [8, 10] }]);
  });
  it('suggests lighter weights for warm-ups and drop sets', () => {
    expect(setLoad('warmup', 100, 2.5)).toBe(50);
    expect(setLoad('drop', 100, 2.5)).toBe(80);
    expect(setLoad('working', 100, 2.5)).toBe(100);
    expect(setLoad('warmup', 23, 2)).toBe(12);
    expect(setLoad('working', null, 2.5)).toBeNull();
  });
  it('starts the stepper somewhere sensible', () => {
    expect(firstStep('barbell', 2.5)).toBe(20);
    expect(firstStep('dumbbell', 2)).toBe(6);
    expect(firstStep('machine', 5)).toBe(10);
  });
  it('checks a plan', () => {
    expect(cleanPlan([{ kind: 'warmup', reps: [10, 10] }, { kind: 'working', reps: [6, 8] }], 100)).toHaveLength(2);
    expect(cleanPlan([{ kind: 'warmup', reps: [10, 10] }], 100)).toBe('Add at least one set that isn’t a warm-up.');
    expect(cleanPlan([{ kind: 'working', reps: [10, 8] }], 100)).toMatch(/lowest first/);
    expect(cleanPlan([{ kind: 'jump', reps: [1, 2] }], 100)).toMatch(/type/);
    expect(cleanPlan(null, 100)).toBeNull();
  });
});
