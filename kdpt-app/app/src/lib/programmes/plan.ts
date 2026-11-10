import { estimateOneRepMax } from '@/lib/rules';

// Rules for a client's live programme: which week they're in, which workouts
// that week has, and which one comes next.

const DAY = 86400000;
const dayStart = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
const parseDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Week 1 starts on the programme's start date. Before it starts, week 1;
// after the last week, the last week (the programme stays usable).
export function weekOf(startsOn: string | null, weeks: number | null, today: Date): number {
  if (!startsOn) return 1;
  const w = Math.floor((dayStart(today) - parseDay(startsOn)) / DAY / 7) + 1;
  return Math.max(1, weeks ? Math.min(weeks, w) : w);
}

export type WeekScoped = { id: string; order: number; weekFrom: number | null; weekTo: number | null };
export const inWeek = (w: WeekScoped, week: number) => (w.weekFrom ?? 1) <= week && week <= (w.weekTo ?? Infinity);
export const workoutsForWeek = <T extends WeekScoped>(all: T[], week: number) => all.filter(w => inWeek(w, week)).sort((a, b) => a.order - b.order);

// The workouts rotate: after the last one finished comes the one after it.
// If the last one isn't in this week's list (a new phase), start at the top.
export function nextWorkout<T extends WeekScoped>(thisWeek: T[], lastDoneId: string | null): T | null {
  if (!thisWeek.length) return null;
  const i = thisWeek.findIndex(w => w.id === lastDoneId);
  return i < 0 ? thisWeek[0] : thisWeek[(i + 1) % thisWeek.length];
}

// From every logged set (newest first), each exercise's most recent session
// (its first set's weight and every set's reps, in order) and its best
// estimated 1-rep max.
export type SetRow = { exercise_id: string; session_id: string; set_number: number; load_kg: number | null; reps: number | null; completed_at: string; kind?: string | null };
export type LastResult = { load: number; reps: number[]; best: number };
export function lastResults(rows: SetRow[]): Record<string, LastResult> {
  const out: Record<string, LastResult & { session: string }> = {};
  const sorted = [...rows].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  // Only working sets count: warm-ups and drop sets would skew "last time".
  const working = (r: SetRow) => r.reps != null && (!r.kind || r.kind === 'working');
  for (const r of sorted) {
    if (!working(r) || r.reps == null) continue;
    const e = estimateOneRepMax(r.load_kg ?? 0, r.reps) ?? 0;
    const cur = out[r.exercise_id];
    if (!cur) out[r.exercise_id] = { session: r.session_id, load: r.load_kg ?? 0, reps: [], best: e };
    const o = out[r.exercise_id];
    o.best = Math.max(o.best, e);
    if (o.session === r.session_id) o.reps.push(r.reps);
  }
  // Sets were collected newest first; put them back in set order.
  for (const [id, o] of Object.entries(out)) {
    const sets = sorted.filter(r => r.exercise_id === id && r.session_id === o.session && working(r)).sort((a, b) => a.set_number - b.set_number);
    o.reps = sets.map(s => s.reps!);
    o.load = sets[0]?.load_kg ?? 0;
  }
  return Object.fromEntries(Object.entries(out).map(([k, { load, reps, best }]) => [k, { load, reps, best }]));
}

// Check-ins. Weekly and fortnightly ones fall on the client's chosen weekday
// (ISO: Monday 1 ... Sunday 7); fortnightly counts every other week from when
// they started. Monthly ones fall on the 1st.
export type Frequency = 'weekly' | 'fortnightly' | 'monthly';
export const nextCheckIn = (freq: Frequency, weekday: number | null, startedOn: string | null, from: Date) => nextFrom(freq, weekday, startedOn, dayStart(from));
function nextFrom(freq: Frequency, weekday: number | null, startedOn: string | null, f: number): string {
  if (freq === 'monthly') {
    const d = new Date(f);
    const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    return isoDay(first >= f ? first : Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  }
  const wd = weekday ?? 7;
  const isoWd = (ms: number) => ((new Date(ms).getUTCDay() + 6) % 7) + 1;
  let t = f + ((wd - isoWd(f) + 7) % 7) * DAY;
  if (freq === 'fortnightly') {
    const anchor = startedOn ? parseDay(startedOn) : f;
    const firstDue = anchor + ((wd - isoWd(anchor) + 7) % 7) * DAY;
    if (Math.round((t - firstDue) / DAY / 7) % 2 !== 0) t += 7 * DAY;
  }
  return isoDay(t);
}

// The round a client is answering now: a check-in stays open for 3 days after
// its due date, so a late one still counts for that round.
export const GRACE_DAYS = 3;
export const currentRound = (freq: Frequency, weekday: number | null, startedOn: string | null, today: Date) =>
  nextFrom(freq, weekday, startedOn, dayStart(today) - GRACE_DAYS * DAY);
// The round after one: the next date strictly after it.
export const roundAfter = (freq: Frequency, weekday: number | null, startedOn: string | null, round: string) =>
  nextFrom(freq, weekday, startedOn, parseDay(round) + DAY);
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Dates are written out by hand rather than with toLocaleDateString, so the
// server and the phone always produce exactly the same words.
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// "Sunday 15 November", for a calendar date.
export const prettyDate = (iso: string) => { const d = new Date(parseDay(iso)); return `${DAY_NAMES[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
// "Fri 6 Nov", for a moment in time, as the day it was in the UK.
export function shortDate(when: string | number): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date(when)).map(p => [p.type, p.value]));
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  return `${DAY_NAMES[(d.getUTCDay() + 6) % 7].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}
