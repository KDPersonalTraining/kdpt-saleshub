import { isoToUk } from '@/lib/time';

// This week, Monday to Sunday, for the strip on Home: which days had a
// workout, and which day is today. Dates are UK dates (YYYY-MM-DD).
export type Day = { label: string; date: string; done: boolean; today: boolean };
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function weekDays(today: string, trained: string[]): Day[] {
  const t = new Date(today + 'T12:00:00Z'), dow = (t.getUTCDay() + 6) % 7;
  const set = new Set(trained);
  return LETTERS.map((label, i) => {
    const date = new Date(t.getTime() + (i - dow) * 86400000).toISOString().slice(0, 10);
    return { label, date, done: set.has(date), today: i === dow };
  });
}
export const ukToday = () => isoToUk(Date.now()).date;
export const trainedDays = (sessions: { startedAt: string }[]) => sessions.map(s => isoToUk(s.startedAt).date);
