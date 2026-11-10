// A client's programme as the coach edits it, and the checks before saving.
// plan: set by set (null = every set the same). startLoad: Kyle's starting weight for their first time.
export type EdItem = { id?: string; exerciseId: string; sets: number; repMin: number; repMax: number; rest: number; priority: 'must_keep' | 'keep_if_time' | 'first_to_cut'; note: string;
  plan?: PlannedSet[] | null; startLoad?: number | null };
export type EdWorkout = { id?: string; name: string; focus: string; phase: string; weekFrom: number | null; weekTo: number | null; items: EdItem[] };
export type EdProgramme = { id: string; name: string; weeks: number; startsOn: string; workouts: EdWorkout[] };
export type LibExercise = { id: string; name: string; pattern: string; measure: 'reps' | 'distance'; muscles: string[] };

import { cleanPlan, type PlannedSet } from './sets';

const PRIOS = ['must_keep', 'keep_if_time', 'first_to_cut'];
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN);

// Returns the cleaned programme, or the first problem in plain words.
export function checkProgramme(p: EdProgramme, library: { id: string; measure: string }[]): { ok: true; p: EdProgramme } | { ok: false; error: string } {
  const name = String(p.name ?? '').trim().slice(0, 80);
  if (!name) return { ok: false, error: 'Give the programme a name.' };
  const weeks = int(p.weeks);
  if (!(weeks >= 1 && weeks <= 52)) return { ok: false, error: 'Length must be 1 to 52 weeks.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.startsOn))) return { ok: false, error: 'Choose a start date.' };
  if (!Array.isArray(p.workouts) || !p.workouts.length) return { ok: false, error: 'Add at least one workout.' };
  if (p.workouts.length > 14) return { ok: false, error: 'Keep it to 14 workouts or fewer.' };
  const known = new Map(library.map(e => [e.id, e.measure]));
  const workouts: EdWorkout[] = [];
  for (const w of p.workouts) {
    const wn = String(w.name ?? '').trim().slice(0, 60);
    if (!wn) return { ok: false, error: 'Every workout needs a name.' };
    const from = w.weekFrom == null ? null : int(w.weekFrom), to = w.weekTo == null ? null : int(w.weekTo);
    if ((from !== null && !(from >= 1 && from <= weeks)) || (to !== null && !(to >= 1 && to <= weeks))) return { ok: false, error: `${wn}: its weeks must be within 1–${weeks}.` };
    if (from !== null && to !== null && from > to) return { ok: false, error: `${wn}: the first week comes after the last.` };
    if (!w.items.length) return { ok: false, error: `${wn} has no exercises.` };
    if (w.items.length > 20) return { ok: false, error: `${wn}: 20 exercises at most.` };
    const items: EdItem[] = [];
    for (const it of w.items) {
      const m = known.get(it.exerciseId);
      if (!m) return { ok: false, error: `${wn}: an exercise isn’t in your library.` };
      const cap = m === 'distance' ? 600 : 100, sets = int(it.sets), lo = int(it.repMin), hi = int(it.repMax), rest = int(it.rest);
      if (!(sets >= 1 && sets <= 10)) return { ok: false, error: `${wn}: sets must be 1 to 10.` };
      if (!(lo >= 1 && hi >= lo && hi <= cap)) return { ok: false, error: `${wn}: ${m === 'distance' ? 'minutes' : 'reps'} must be 1 to ${cap}, lowest first.` };
      if (!(rest >= 0 && rest <= 600)) return { ok: false, error: `${wn}: rest must be 0 to 10 minutes.` };
      if (!PRIOS.includes(it.priority)) return { ok: false, error: `${wn}: choose what happens when short on time.` };
      const plan = cleanPlan(it.plan ?? null, cap);
      if (typeof plan === 'string') return { ok: false, error: `${wn}: ${plan}` };
      const start = it.startLoad == null || (it.startLoad as unknown) === '' ? null : Number(it.startLoad);
      if (start !== null && !(start >= 0 && start <= 500)) return { ok: false, error: `${wn}: starting weight must be 0 to 500 kg.` };
      items.push({ ...(it.id ? { id: it.id } : {}), exerciseId: it.exerciseId, sets: plan ? plan.length : sets, repMin: lo, repMax: hi, rest, priority: it.priority, note: String(it.note ?? '').trim().slice(0, 300), plan, startLoad: start });
    }
    workouts.push({ ...(w.id ? { id: w.id } : {}), name: wn, focus: String(w.focus ?? '').trim().slice(0, 80), phase: String(w.phase ?? '').trim().slice(0, 60), weekFrom: from, weekTo: to, items });
  }
  return { ok: true, p: { id: p.id, name, weeks, startsOn: p.startsOn, workouts } };
}

// Exercises that can stand in for another: same movement and same way of
// logging; for isolation moves, the same main muscle too.
export function alternativesFor<T extends LibExercise>(ex: T, library: T[], max = 4): T[] {
  return library.filter(o => o.id !== ex.id && o.pattern === ex.pattern && o.measure === ex.measure
    && (!ex.pattern.startsWith('isolation') || o.muscles[0] === ex.muscles[0])).slice(0, max);
}
