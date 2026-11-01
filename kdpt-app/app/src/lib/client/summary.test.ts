import { describe, expect, it } from 'vitest';
import { parseLoad, parseReps, summarise } from './summary';

describe('input checks', () => {
  it('accepts sensible weights, including decimals and commas', () => {
    expect(parseLoad('120')).toBe(120);
    expect(parseLoad('57.5')).toBe(57.5);
    expect(parseLoad('57,5')).toBe(57.5);
    expect(parseLoad('0')).toBe(0);
  });
  it('rejects nonsense weights', () => {
    for (const v of ['', 'abc', '12a', '-5', '501', '1.234', '1200120']) expect(parseLoad(v)).toBeNull();
  });
  it('accepts whole reps from 1 to 100 only', () => {
    expect(parseReps('12')).toBe(12);
    for (const v of ['', '0', '10.5', '101', 'ten']) expect(parseReps(v)).toBeNull();
  });
});

const legPress = { id: 'lp', name: 'Leg Press', last: { load: 120, reps: [12, 12, 12] }, best: 0 };

describe('summarise', () => {
  it('counts only completed, valid sets', () => {
    const s = summarise({ exercises: [legPress], skipped: {}, startedAt: null, finishedAt: null,
      logs: { lp: [{ load: '130', reps: '10', done: true }, { load: '130', reps: '', done: true }, { load: '130', reps: '9', done: false }] } });
    expect(s.sets).toBe(1);
    expect(s.volumeKg).toBe(1300);
  });
  it('flags a record only when it beats last time', () => {
    const up = summarise({ exercises: [legPress], skipped: {}, startedAt: null, finishedAt: null, logs: { lp: [{ load: '130', reps: '12', done: true }] } });
    expect(up.records).toEqual([{ exercise: 'Leg Press', was: 168, now: 182, set: '130 kg × 12' }]);
    const same = summarise({ exercises: [legPress], skipped: {}, startedAt: null, finishedAt: null, logs: { lp: [{ load: '120', reps: '12', done: true }] } });
    expect(same.records).toEqual([]);
  });
  it('also respects the best before last session', () => {
    const s = summarise({ exercises: [{ ...legPress, best: 200 }], skipped: {}, startedAt: null, finishedAt: null, logs: { lp: [{ load: '130', reps: '12', done: true }] } });
    expect(s.records).toEqual([]);
  });
  it('works out the time from start and finish, and lists skipped exercises', () => {
    const s = summarise({ exercises: [legPress], skipped: { lp: true }, startedAt: 0 + 1, finishedAt: 1 + 47 * 60000, logs: {} });
    expect(s.minutes).toBe(47);
    expect(s.skipped).toEqual(['Leg Press']);
  });
  it('has no time if the start is unknown', () => {
    expect(summarise({ exercises: [], skipped: {}, startedAt: null, finishedAt: 5, logs: {} }).minutes).toBeNull();
  });
});
