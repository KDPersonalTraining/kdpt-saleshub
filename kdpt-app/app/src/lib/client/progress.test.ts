import { describe, expect, it } from 'vitest';
import { buildProgress, weekStart, type LogRow } from './progress';

const r = (session: string, date: string, name: string, load: number | null, reps: number | null, distance: number | null = null): LogRow =>
  ({ exercise_id: name, name, session_id: session, load_kg: load, reps, distance_m: distance, completed_at: `${date}T10:00:00Z` });

describe('progress from logged sets', () => {
  const rows = [
    r('s1', '2026-11-02', 'Leg Press', 100, 10), r('s1', '2026-11-02', 'Leg Press', 100, 8), r('s1', '2026-11-02', 'Rowing Machine', null, null, 2000),
    r('s2', '2026-11-05', 'Leg Press', 110, 10), r('s2', '2026-11-05', 'Plank', null, 1),
    r('s3', '2026-11-10', 'Goblet Squat', 16, 12),
  ];
  const p = buildProgress(rows, new Date('2026-11-11T12:00:00Z'));
  it('finds bests and trends from loaded sets only', () => {
    expect(p.records.map(x => [x.name, x.e1rm, x.set])).toEqual([['Goblet Squat', 22, '16 kg × 12'], ['Leg Press', 147, '110 kg × 10']]);
    expect(p.lifts).toHaveLength(1);
    expect(p.lifts[0].points.map(x => Math.round(x.e1rm))).toEqual([133, 147]);
  });
  it('adds up weeks and totals, cardio as distance', () => {
    expect(p.totals).toEqual({ sessions: 3, volume: 100 * 10 + 100 * 8 + 110 * 10 + 16 * 12, distance: 2000 });
    expect(p.weeks.slice(-2).map(w => [w.start, w.sessions])).toEqual([['2026-11-02', 2], ['2026-11-09', 1]]);
    expect(p.weeks).toHaveLength(8);
  });
  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-15T23:00:00Z')).toBe('2026-11-09');
    expect(weekStart('2026-11-16T00:30:00Z')).toBe('2026-11-16');
  });
});
