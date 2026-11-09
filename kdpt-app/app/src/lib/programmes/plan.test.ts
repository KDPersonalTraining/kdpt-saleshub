import { describe, expect, it } from 'vitest';
import { currentRound, lastResults, nextCheckIn, nextWorkout, roundAfter, weekOf, workoutsForWeek } from './plan';
import { STARTERS, exerciseBySlug, phasesOf } from './starters';

const w = (id: string, order: number, weekFrom: number | null = null, weekTo: number | null = null) => ({ id, order, weekFrom, weekTo });

describe('programme weeks', () => {
  it('counts weeks from the start date and stays within the programme', () => {
    expect(weekOf('2026-11-09', 12, new Date(2026, 10, 9))).toBe(1);
    expect(weekOf('2026-11-09', 12, new Date(2026, 10, 15))).toBe(1);
    expect(weekOf('2026-11-09', 12, new Date(2026, 10, 16))).toBe(2);
    expect(weekOf('2026-11-09', 12, new Date(2026, 10, 1))).toBe(1);
    expect(weekOf('2026-11-09', 12, new Date(2027, 5, 1))).toBe(12);
    expect(weekOf(null, 8, new Date())).toBe(1);
  });
  it('picks the workouts for a week, in order', () => {
    const all = [w('b1', 2, 1, 3), w('a1', 1, 1, 3), w('a2', 1, 4, 6), w('b2', 2, 4, 6), w('x', 3)];
    expect(workoutsForWeek(all, 2).map(x => x.id)).toEqual(['a1', 'b1', 'x']);
    expect(workoutsForWeek(all, 4).map(x => x.id)).toEqual(['a2', 'b2', 'x']);
  });
  it('rotates to the workout after the last one done', () => {
    const wk = [w('a', 1), w('b', 2), w('c', 3)];
    expect(nextWorkout(wk, null)?.id).toBe('a');
    expect(nextWorkout(wk, 'a')?.id).toBe('b');
    expect(nextWorkout(wk, 'c')?.id).toBe('a');
    expect(nextWorkout(wk, 'old-phase')?.id).toBe('a');
    expect(nextWorkout([], 'a')).toBeNull();
  });
});

describe('last results', () => {
  it('uses the most recent session for each exercise, in set order, and keeps the best', () => {
    const r = lastResults([
      { exercise_id: 'lp', session_id: 's1', set_number: 1, load_kg: 100, reps: 10, completed_at: '2026-11-01T10:00:00Z' },
      { exercise_id: 'lp', session_id: 's2', set_number: 2, load_kg: 110, reps: 9, completed_at: '2026-11-08T10:05:00Z' },
      { exercise_id: 'lp', session_id: 's2', set_number: 1, load_kg: 110, reps: 10, completed_at: '2026-11-08T10:02:00Z' },
      { exercise_id: 'lp', session_id: 's0', set_number: 1, load_kg: 120, reps: 5, completed_at: '2026-10-01T10:00:00Z' },
    ]);
    expect(r.lp.load).toBe(110);
    expect(r.lp.reps).toEqual([10, 9]);
    expect(r.lp.best).toBe(146.7);
  });
});

describe('check-in days', () => {
  it('weekly: the next chosen weekday, today included', () => {
    expect(nextCheckIn('weekly', 7, null, new Date(2026, 10, 9))).toBe('2026-11-15'); // Mon -> Sun
    expect(nextCheckIn('weekly', 1, null, new Date(2026, 10, 9))).toBe('2026-11-09');
  });
  it('fortnightly: every other week from the start', () => {
    expect(nextCheckIn('fortnightly', 7, '2026-11-02', new Date(2026, 10, 9))).toBe('2026-11-22');
    expect(nextCheckIn('fortnightly', 7, '2026-11-02', new Date(2026, 10, 3))).toBe('2026-11-08');
    expect(roundAfter('fortnightly', 7, '2026-11-02', '2026-11-08')).toBe('2026-11-22');
  });
  it('monthly: the 1st', () => {
    expect(nextCheckIn('monthly', null, null, new Date(2026, 10, 9))).toBe('2026-12-01');
    expect(nextCheckIn('monthly', null, null, new Date(2026, 11, 1))).toBe('2026-12-01');
  });
  it('a check-in stays open for 3 days after it was due', () => {
    expect(currentRound('weekly', 7, null, new Date(2026, 10, 17))).toBe('2026-11-15'); // Tue after
    expect(currentRound('weekly', 7, null, new Date(2026, 10, 19))).toBe('2026-11-22'); // Thu after
  });
});

describe('starter programmes', () => {
  it('only use exercises in the library, with sensible prescriptions', () => {
    for (const s of STARTERS) for (const wk of s.workouts) for (const it of wk.items) {
      expect(exerciseBySlug(it.slug), `${s.key}: ${it.slug}`).toBeTruthy();
      expect(it.reps[0]).toBeLessThanOrEqual(it.reps[1]);
      expect(it.sets).toBeGreaterThan(0);
    }
  });
  it('beginner foundations covers every week once per workout and brings in new moves', () => {
    const b = STARTERS.find(s => s.key === 'beginner-foundations')!;
    expect(phasesOf(b).map(p => [p[1], p[2]])).toEqual([[1, 3], [4, 6], [7, 9], [10, 12]]);
    const moves = (from: number) => new Set(b.workouts.filter(x => x.weeks![0] === from).flatMap(x => x.items.map(i => i.slug)));
    const before = moves(1), later = moves(10);
    expect([...later].filter(m => !before.has(m)).length).toBeGreaterThan(5);
  });
});

describe('dates in words', () => {
  it('are the same everywhere', async () => {
    const { prettyDate, shortDate } = await import('./plan');
    expect(prettyDate('2026-11-15')).toBe('Sunday 15 November');
    expect(shortDate('2026-11-06T09:00:00Z')).toBe('Fri 6 Nov');
    expect(shortDate('2026-07-06T23:30:00Z')).toBe('Tue 7 Jul'); // 00:30 in the UK (summer time)
  });
});
