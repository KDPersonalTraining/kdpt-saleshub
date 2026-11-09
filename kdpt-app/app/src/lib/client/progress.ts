import { estimateOneRepMax } from '@/lib/rules';

// A client's progress from their logged sets: personal bests, how each lift
// is trending, and weekly totals.
export type LogRow = { exercise_id: string; name: string; session_id: string; load_kg: number | null; reps: number | null; distance_m: number | null; completed_at: string };
export type Progress = {
  records: { name: string; e1rm: number; set: string; date: string }[];
  lifts: { name: string; points: { date: string; e1rm: number; set: string }[] }[];
  weeks: { start: string; sessions: number; volume: number; distance: number }[];
  totals: { sessions: number; volume: number; distance: number };
};

const DAY = 86400000;
// Monday of the week a moment falls in (UTC), as YYYY-MM-DD.
export const weekStart = (iso: string) => { const d = new Date(iso.slice(0, 10) + 'T00:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10); };

export function buildProgress(rows: LogRow[], now = new Date(), weeksBack = 8): Progress {
  const bySession = new Map<string, LogRow[]>();
  for (const r of rows) bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]);

  // Each session's best estimated 1-rep max per exercise.
  const best = new Map<string, { name: string; pts: Map<string, { date: string; e1rm: number; set: string }> }>();
  for (const r of rows) {
    if (r.distance_m != null || !r.load_kg || !r.reps) continue;
    const e = estimateOneRepMax(Number(r.load_kg), r.reps);
    if (e === null) continue;
    const ex = best.get(r.exercise_id) ?? { name: r.name, pts: new Map() };
    const cur = ex.pts.get(r.session_id);
    if (!cur || e > cur.e1rm) ex.pts.set(r.session_id, { date: r.completed_at, e1rm: e, set: `${Number(r.load_kg)} kg × ${r.reps}` });
    best.set(r.exercise_id, ex);
  }
  const records = [...best.values()].map(x => { const top = [...x.pts.values()].sort((a, b) => b.e1rm - a.e1rm || a.date.localeCompare(b.date))[0]; return { name: x.name, e1rm: Math.round(top.e1rm), set: top.set, date: top.date }; })
    .sort((a, b) => b.date.localeCompare(a.date));
  const lifts = [...best.values()].filter(x => x.pts.size >= 2).sort((a, b) => b.pts.size - a.pts.size).slice(0, 8)
    .map(x => ({ name: x.name, points: [...x.pts.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-12) }));

  const thisWeek = weekStart(now.toISOString());
  const weeks = Array.from({ length: weeksBack }, (_, i) => ({ start: new Date(Date.parse(thisWeek) - (weeksBack - 1 - i) * 7 * DAY).toISOString().slice(0, 10), sessions: 0, volume: 0, distance: 0 }));
  const totals = { sessions: bySession.size, volume: 0, distance: 0 };
  for (const [, list] of bySession) {
    const vol = list.reduce((t, r) => t + Number(r.load_kg ?? 0) * (r.reps ?? 0), 0), dist = list.reduce((t, r) => t + Number(r.distance_m ?? 0), 0);
    totals.volume += vol; totals.distance += dist;
    const w = weeks.find(x => x.start === weekStart(list[0].completed_at));
    if (w) { w.sessions += 1; w.volume += vol; w.distance += dist; }
  }
  totals.volume = Math.round(totals.volume); totals.distance = Math.round(totals.distance);
  for (const w of weeks) { w.volume = Math.round(w.volume); w.distance = Math.round(w.distance); }
  return { records, lifts, weeks, totals };
}
