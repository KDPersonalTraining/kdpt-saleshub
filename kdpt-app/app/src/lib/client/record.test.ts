import { describe, expect, it } from 'vitest';
import { sessionJob } from './record';
import { planFor } from './workout';

const base = { id: 'x', lib: 'x', sets: 2, rest: 60, priority: 'must_keep' as const, setup: 1, kit: 'machine' as const, last: { load: 0, reps: [] }, alts: [] };
const w = { id: 'w1', name: 'Intervals', exercises: [
  { ...base, id: 'we-row', name: 'Rowing Machine', reps: [4, 5] as [number, number], inc: 0, measure: 'distance' as const, exerciseId: 'e-row' },
  { ...base, id: 'we-lp', name: 'Leg Press', reps: [10, 12] as [number, number], inc: 10, exerciseId: 'e-lp' },
] };

describe('saving a workout', () => {
  it('saves cardio as distance and time, weights as kg and reps', () => {
    const s = { startedAt: 1_000_000, finishedAt: 2_000_000, sid: 'sess', duration: 60, skipped: {}, swaps: {}, exNotes: { 'we-lp': { rpe: 8, note: '' } },
      logs: { 'we-row': [{ load: '1.25', reps: '5', done: true }, { load: '', reps: '5', done: true }], 'we-lp': [{ load: '100', reps: '10', done: true }, { load: '100', reps: '9', done: false }] } };
    const job = sessionJob(s as never, w, { clientId: 'c', orgId: 'o' })!;
    expect(job.session).toMatchObject({ id: 'sess', workout_id: 'w1', workout_name: 'Intervals', session_rpe: 8, client_note: 'Leg Press: RPE 8' });
    expect(job.sets.map(x => [x.exercise_id, x.load_kg, x.reps, x.distance_m, x.duration_s])).toEqual([
      ['e-row', null, null, 1250, 300], ['e-lp', 100, 10, undefined, undefined]]);
  });
  it('logs a swapped exercise as the one really done', () => {
    const ww = { ...w, exercises: [{ ...w.exercises[1], altIds: { 'Hack Squat': 'e-hack' } }] };
    const s = { startedAt: 1, finishedAt: 2, sid: 'x', duration: 60, skipped: {}, exNotes: {}, swaps: { 'we-lp': 'Hack Squat' }, logs: { 'we-lp': [{ load: '80', reps: '10', done: true }] } };
    const job = sessionJob(s as never, ww, { clientId: 'c', orgId: 'o' })!;
    expect(job.sets[0].exercise_id).toBe('e-hack');
    expect(job.session.client_note).toBe('Leg Press: swapped to Hack Squat');
  });
  it('counts cardio minutes when estimating how long a workout takes', () => {
    expect(planFor(90, w).minutes).toBeGreaterThan(20);
  });
});
