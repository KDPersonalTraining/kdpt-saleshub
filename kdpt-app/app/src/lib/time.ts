// UK time. Sessions are stored as moments (UTC) but people think in UK
// clock time, including after the clocks change.
const TZ = 'Europe/London';
const parts = (ms: number) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
  .formatToParts(new Date(ms)).map(p => [p.type, p.value]));
// How far UK clocks are ahead of UTC at a moment, in ms (0 or 1 hour).
const offset = (ms: number) => { const p = parts(ms); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 60000) * 60000; };

// "2026-11-12", "07:00" (UK) -> ISO moment.
export function ukToIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - offset(guess);
  t = guess - offset(t);
  return new Date(t).toISOString();
}
// ISO moment -> UK date, time and short weekday.
export function isoToUk(iso: string | number): { date: string; time: string; weekday: string } {
  const p = parts(typeof iso === 'number' ? iso : Date.parse(iso));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: p.weekday };
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "Thu 12 Nov, 07:00"
export function ukWhen(iso: string): string {
  const u = isoToUk(iso), [, m, d] = u.date.split('-').map(Number);
  return `${u.weekday} ${d} ${MONTHS[m - 1]}, ${u.time}`;
}
// The same UK clock time, n weeks later.
export const addWeeksUk = (date: string, n: number) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + 7 * n)).toISOString().slice(0, 10); };
