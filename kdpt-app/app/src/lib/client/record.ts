import type { CurrentWorkout } from './live';
import type { ClientState } from './store';
import { parseKm, parseLoad, parseMins, parseReps } from './summary';
import { suggestionFor } from './workout';
import type { SessionJob } from './sync';

const uuid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
export { uuid };

// A finished workout as rows for the database: the session, and every set
// that was ticked off with a valid weight and reps. RPE and notes per exercise
// go into the session note so Kyle sees them together.
export function sessionJob(s: ClientState, w: CurrentWorkout, who: { clientId: string; orgId: string }, now = Date.now()): SessionJob | null {
  if (!w.id || s.startedAt == null) return null;
  // A workout started before session ids existed gets one now.
  const sid = s.sid ?? uuid();
  const finished = new Date(s.finishedAt ?? now).toISOString();
  const sets: SessionJob['sets'] = [];
  const notes: string[] = [], rpes: number[] = [];
  for (const ex of w.exercises) {
    if (!ex.exerciseId) continue;
    const done = (s.logs[ex.id] ?? []).filter(x => x.done);
    let n = 0;
    for (const x of done) {
      if (ex.measure === 'distance') {
        const km = parseKm(x.load), min = parseMins(x.reps);
        if (km === null || min === null) continue;
        n += 1;
        sets.push({ id: uuid(), org_id: who.orgId, client_id: who.clientId, session_id: sid, workout_exercise_id: ex.id, exercise_id: ex.exerciseId,
          set_number: n, kind: 'working', load_kg: null, reps: null, distance_m: Math.round(km * 1000), duration_s: min * 60,
          completed_at: finished, device_updated_at: finished });
        continue;
      }
      const reps = parseReps(x.reps), load = ex.inc === 0 ? 0 : parseLoad(x.load);
      if (reps === null || load === null) continue;
      n += 1;
      sets.push({ id: uuid(), org_id: who.orgId, client_id: who.clientId, session_id: sid, workout_exercise_id: ex.id, exercise_id: ex.exerciseId,
        set_number: n, kind: 'working', load_kg: ex.inc === 0 ? null : load, reps, suggested_load_kg: ex.inc === 0 || !ex.last.reps.length ? null : suggestionFor(ex).load,
        completed_at: finished, device_updated_at: finished });
    }
    const m = s.exNotes[ex.id];
    if (m?.rpe) rpes.push(m.rpe);
    const bits = [s.skipped[ex.id] ? 'skipped' : '', m?.rpe ? `RPE ${m.rpe}` : '', m?.note?.trim() ?? ''].filter(Boolean);
    if (bits.length) notes.push(`${ex.name}: ${bits.join(' · ')}`);
  }
  const minutes = [30, 45, 60, 90].includes(s.duration) ? s.duration : null;
  return {
    session: { id: sid, org_id: who.orgId, client_id: who.clientId, workout_id: w.id, chosen_minutes: minutes, status: 'completed',
      started_at: new Date(s.startedAt).toISOString(), completed_at: finished,
      session_rpe: rpes.length ? Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length) : null, client_note: notes.join('\n') || null },
    sets,
  };
}
