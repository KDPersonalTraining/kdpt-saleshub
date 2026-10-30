import { describe, expect, it } from 'vitest';
import { fitToTime, planMinutes, type PlannedExercise } from './shortening';

// Sarah's Lower Body A, as in the prototype.
const LOWER_A: PlannedExercise[] = [
  { id: 'leg-press', sets: 3, restSeconds: 120, setupMinutes: 1.5, priority: 'must_keep' },
  { id: 'rdl', sets: 3, restSeconds: 120, setupMinutes: 1.5, priority: 'must_keep' },
  { id: 'lunge', sets: 3, restSeconds: 90, setupMinutes: 1, priority: 'keep_if_time' },
  { id: 'leg-curl', sets: 3, restSeconds: 75, setupMinutes: 1, priority: 'keep_if_time' },
  { id: 'calf-raise', sets: 2, restSeconds: 60, setupMinutes: 0.5, priority: 'first_to_cut' },
  { id: 'dead-bug', sets: 2, restSeconds: 45, setupMinutes: 0.5, priority: 'first_to_cut' },
];

describe('fitToTime', () => {
  it('leaves the plan alone when there is time', () => {
    const p = fitToTime(LOWER_A, 90);
    expect(p.items.map(i => i.sets)).toEqual([3, 3, 3, 3, 2, 2]);
    expect(p.removed).toEqual([]);
    expect(p.fits).toBe(true);
  });

  it('cuts "first to cut" exercises before anything else', () => {
    const full = Math.round(planMinutes(LOWER_A.map(exercise => ({ exercise, sets: exercise.sets }))));
    const p = fitToTime(LOWER_A, full - 3);
    expect(p.removed[0]).toBe('dead-bug');
    expect(p.items.find(i => i.exercise.id === 'leg-press')?.sets).toBe(3);
  });

  it('fits 45 minutes by dropping one "first to cut" exercise', () => {
    const p = fitToTime(LOWER_A, 45);
    expect(p).toMatchObject({ fits: true, removed: ['dead-bug'], trimmed: [] });
  });

  it('fits 40 minutes by cutting extras, then trimming "keep if time" sets', () => {
    const p = fitToTime(LOWER_A, 40);
    expect(p).toMatchObject({ fits: true, removed: ['dead-bug', 'calf-raise'], trimmed: ['lunge'] });
    expect(p.minutes).toBeLessThanOrEqual(40);
    expect(p.items.map(i => [i.exercise.id, i.sets])).toEqual([['leg-press', 3], ['rdl', 3], ['lunge', 2], ['leg-curl', 3]]);
  });

  it('keeps must-keep exercises even when the time is impossible', () => {
    const p = fitToTime(LOWER_A, 10);
    expect(p.fits).toBe(false);
    expect(p.items.map(i => [i.exercise.id, i.sets])).toEqual([['leg-press', 2], ['rdl', 2]]);
  });

  it('does not change the input', () => {
    const copy = structuredClone(LOWER_A);
    fitToTime(LOWER_A, 30);
    expect(LOWER_A).toEqual(copy);
  });
});
