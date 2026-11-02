import { estimateOneRepMax } from '@/lib/rules';

// Input checks for logging a set. Anything that isn't a sensible number is
// rejected rather than guessed at.
export const MAX_LOAD_KG = 500, MAX_REPS = 100;

export function parseLoad(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= MAX_LOAD_KG ? n : null;
}

export function parseReps(v: string): number | null {
  const t = v.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= MAX_REPS ? n : null;
}

export type LoggedSet = { load: string; reps: string; done: boolean };
export type SummaryInput = {
  exercises: { id: string; name: string; last: { load: number; reps: number[] }; best?: number }[];
  logs: Record<string, LoggedSet[]>;
  skipped: Record<string, boolean>;
  startedAt: number | null;
  finishedAt: number | null;
};
export type Record_ = { exercise: string; was: number; now: number; set: string };
export type Summary = { minutes: number | null; sets: number; volumeKg: number; skipped: string[]; records: Record_[] };

// What the client actually did. A record is a completed set whose estimated
// 1-rep max beats both last session and the client's best before today.
export function summarise({ exercises, logs, skipped, startedAt, finishedAt }: SummaryInput): Summary {
  let sets = 0, volume = 0;
  const records: Record_[] = [];
  for (const ex of exercises) {
    const done = (logs[ex.id] ?? []).filter(s => s.done)
      .map(s => ({ load: parseLoad(s.load), reps: parseReps(s.reps) }))
      .filter((s): s is { load: number; reps: number } => s.load !== null && s.reps !== null);
    sets += done.length;
    volume += done.reduce((t, s) => t + s.load * s.reps, 0);
    const lastBest = Math.max(0, ...ex.last.reps.map(r => estimateOneRepMax(ex.last.load, r) ?? 0));
    const before = Math.max(lastBest, ex.best ?? 0);
    let top: { e: number; s: { load: number; reps: number } } | null = null;
    for (const s of done) { const e = estimateOneRepMax(s.load, s.reps); if (e !== null && (!top || e > top.e)) top = { e, s }; }
    if (top && before > 0 && top.e > before) records.push({ exercise: ex.name, was: Math.round(before), now: Math.round(top.e), set: `${top.s.load} kg × ${top.s.reps}` });
  }
  const minutes = startedAt && finishedAt && finishedAt > startedAt ? Math.max(1, Math.round((finishedAt - startedAt) / 60000)) : null;
  return { minutes, sets, volumeKg: Math.round(volume), skipped: exercises.filter(e => skipped[e.id]).map(e => e.name), records };
}
