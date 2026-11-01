// Progress over a chosen period, described in plain words and judged against
// the client's goal: a drop in weight is only "good" if they want to lose it.

export type Point = { date: string; value: number }; // ISO date
export type Change = { from: Point; to: Point; delta: number; pct: number; days: number; sinceStart: boolean };

const DAY = 86400_000;
const ms = (d: string) => Date.parse(d + 'T12:00:00Z');

// Change across the last `days` days up to `today`. If the history doesn't go
// back that far, it compares from the first record instead and says so.
export function windowChange(points: Point[], days: number, today: string): Change | null {
  const sorted = points.filter(p => ms(p.date) <= ms(today)).sort((a, b) => ms(a.date) - ms(b.date));
  if (sorted.length < 2) return null;
  const startMs = ms(today) - days * DAY;
  const inWindow = sorted.filter(p => ms(p.date) >= startMs);
  const sinceStart = ms(sorted[0].date) >= startMs;
  // The baseline is the last record at or before the window start, if any.
  const before = sorted.filter(p => ms(p.date) <= startMs);
  const from = before.length ? before[before.length - 1] : inWindow[0];
  const to = sorted[sorted.length - 1];
  if (!from || from === to) return null;
  const delta = Math.round((to.value - from.value) * 10) / 10;
  return { from, to, delta, pct: from.value ? Math.round(delta / from.value * 100) : 0, days: Math.round((ms(to.date) - ms(from.date)) / DAY), sinceStart };
}

export type Direction = 'up' | 'down' | 'either';
export type Tone = 'good' | 'neutral' | 'watch';

export function describe(c: Change, unit: string, want: Direction): { text: string; tone: Tone } {
  const weeks = Math.max(1, Math.round(c.days / 7));
  const span = c.sinceStart ? `since you started (${weeks} week${weeks === 1 ? '' : 's'})` : `in ${weeks} week${weeks === 1 ? '' : 's'}`;
  if (c.delta === 0) return { text: `No change ${span}`, tone: 'neutral' };
  const amount = `${Math.abs(c.delta)}${unit}`;
  const text = `${c.delta > 0 ? 'Up' : 'Down'} ${amount} ${span}`;
  if (want === 'either') return { text, tone: 'neutral' };
  return { text, tone: (c.delta > 0) === (want === 'up') ? 'good' : 'watch' };
}

// Trailing average, so one salty meal or a late night doesn't look like a trend.
export function movingAverage(points: Point[], window = 7): Point[] {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return { date: p.date, value: Math.round(slice.reduce((a, x) => a + x.value, 0) / slice.length * 10) / 10 };
  });
}

// "19 Oct" → "2026-10-19" for the sample data (all in 2026).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const isoFromShort = (s: string, year = 2026) => { const [d, m] = s.split(' '); return `${year}-${String(MONTHS.indexOf(m) + 1).padStart(2, '0')}-${d.padStart(2, '0')}`; };
