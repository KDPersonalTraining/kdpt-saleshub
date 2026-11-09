import { describe, expect, it } from 'vitest';
import { alternativesFor, checkProgramme, type EdProgramme } from './edit';

const lib = [{ id: 'lp', measure: 'reps' }, { id: 'row', measure: 'distance' }];
const good = (): EdProgramme => ({ id: 'p', name: ' Block 2 ', weeks: 8, startsOn: '2026-11-16', workouts: [
  { name: 'Lower', focus: '', phase: '', weekFrom: null, weekTo: null, items: [
    { exerciseId: 'lp', sets: 3, repMin: 8, repMax: 10, rest: 120, priority: 'must_keep', note: '' },
    { exerciseId: 'row', sets: 1, repMin: 20, repMax: 30, rest: 60, priority: 'first_to_cut', note: 'Easy pace' }] }] });

describe('checking an edited programme', () => {
  it('accepts a sensible one and tidies it', () => {
    const r = checkProgramme(good(), lib);
    expect(r.ok && r.p.name).toBe('Block 2');
  });
  it('allows long cardio, but not long sets of reps', () => {
    const p = good(); p.workouts[0].items[1].repMax = 90;
    expect(checkProgramme(p, lib).ok).toBe(true);
    const q = good(); q.workouts[0].items[0].repMax = 150;
    expect(checkProgramme(q, lib)).toEqual({ ok: false, error: 'Lower: reps must be 1 to 100, lowest first.' });
  });
  it('catches the usual mistakes', () => {
    const cases: [(p: EdProgramme) => void, string][] = [
      [p => { p.name = ''; }, 'Give the programme a name.'],
      [p => { p.workouts = []; }, 'Add at least one workout.'],
      [p => { p.workouts[0].items = []; }, 'Lower has no exercises.'],
      [p => { p.workouts[0].weekFrom = 5; p.workouts[0].weekTo = 2; }, 'Lower: the first week comes after the last.'],
      [p => { p.workouts[0].weekTo = 9; }, 'Lower: its weeks must be within 1–8.'],
      [p => { p.workouts[0].items[0].exerciseId = 'nope'; }, 'Lower: an exercise isn’t in your library.'],
      [p => { p.workouts[0].items[0].sets = 0; }, 'Lower: sets must be 1 to 10.'],
    ];
    for (const [f, msg] of cases) { const p = good(); f(p); expect(checkProgramme(p, lib)).toEqual({ ok: false, error: msg }); }
  });
});

describe('alternatives', () => {
  const L = [
    { id: 'lp', name: 'Leg Press', pattern: 'squat', measure: 'reps' as const, muscles: ['Quads'] },
    { id: 'gs', name: 'Goblet Squat', pattern: 'squat', measure: 'reps' as const, muscles: ['Quads'] },
    { id: 'rdl', name: 'RDL', pattern: 'hinge', measure: 'reps' as const, muscles: ['Hamstrings'] },
    { id: 'curl', name: 'Curl', pattern: 'isolation_upper', measure: 'reps' as const, muscles: ['Biceps'] },
    { id: 'hc', name: 'Hammer Curl', pattern: 'isolation_upper', measure: 'reps' as const, muscles: ['Biceps'] },
    { id: 'lat', name: 'Lateral Raise', pattern: 'isolation_upper', measure: 'reps' as const, muscles: ['Side shoulders'] },
  ];
  it('offers the same movement, and the same muscle for isolation moves', () => {
    expect(alternativesFor(L[0], L).map(x => x.id)).toEqual(['gs']);
    expect(alternativesFor(L[3], L).map(x => x.id)).toEqual(['hc']);
  });
});
