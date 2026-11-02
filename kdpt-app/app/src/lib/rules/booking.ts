// Monthly booking rules. Kyle's clients mostly train in the same slots every
// week: each month, those regular slots are turned into proposed sessions,
// checked against working hours, time off, holidays and each other (with
// travel time between gyms), then sent to clients to accept.
//
// Times are local wall-clock times in the UK: a date ("2026-11-02") plus
// minutes after midnight. That keeps 7:00 meaning 7:00 across clock changes.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Monday = 0
export type Hours = Record<Weekday, [number, number] | null>; // [start, end] in minutes
export type Pattern = { client: string; weekday: Weekday; start: number; minutes: number; location: string };
export type Busy = { date: string; start: number; end: number; reason: string };
export type Session = { client: string; date: string; start: number; end: number; location: string };
export type Problem = 'outside_hours' | 'day_off' | 'holiday' | 'blocked' | 'clash' | 'travel' | 'over_allowance';
export type Proposal = Session & { problem?: Problem; detail?: string };

export const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
export const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };

// Every date in a month with its weekday (Monday = 0). month is 1–12.
export function daysOfMonth(year: number, month: number): { date: string; weekday: Weekday }[] {
  const out: { date: string; weekday: Weekday }[] = [];
  const n = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= n; d++) {
    const t = new Date(Date.UTC(year, month - 1, d));
    out.push({ date: t.toISOString().slice(0, 10), weekday: ((t.getUTCDay() + 6) % 7) as Weekday });
  }
  return out;
}

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }, gap = 0) => a.start < b.end + gap && b.start < a.end + gap;

export type MonthInput = {
  year: number; month: number; patterns: Pattern[]; hours: Hours;
  holidays?: string[]; busy?: Busy[]; existing?: Session[];
  // Minutes needed to get between two locations (0 if the same).
  travel?: (from: string, to: string) => number;
  // Sessions each client's package includes this month, e.g. { Sarah: 8 }.
  allowance?: Record<string, number>;
};

// Turns regular slots into the month's proposed sessions. Sessions that can't
// go ahead as they are carry a problem, so Kyle can move them before sending.
// Earlier proposals win a clash, so the order of patterns is the priority.
export function generateMonth({ year, month, patterns, hours, holidays = [], busy = [], existing = [], travel = () => 0, allowance = {} }: MonthInput): Proposal[] {
  const out: Proposal[] = [];
  const placed: Session[] = [...existing];
  const used: Record<string, number> = {};
  for (const day of daysOfMonth(year, month)) {
    for (const p of patterns.filter(x => x.weekday === day.weekday)) {
      const s: Proposal = { client: p.client, date: day.date, start: p.start, end: p.start + p.minutes, location: p.location };
      const h = hours[day.weekday];
      const block = busy.find(b => b.date === day.date && overlaps(b, s));
      const sameDay = placed.filter(x => x.date === day.date);
      const clash = sameDay.find(x => overlaps(x, s));
      const tight = sameDay.find(x => x.location !== s.location && overlaps(x, s, travel(x.location, s.location)));
      if (allowance[p.client] !== undefined && (used[p.client] ?? 0) >= allowance[p.client]) { s.problem = 'over_allowance'; s.detail = `Beyond ${p.client}'s ${allowance[p.client]} sessions this month`; }
      else if (holidays.includes(day.date)) { s.problem = 'holiday'; s.detail = 'You\'re off this day'; }
      else if (!h) { s.problem = 'day_off'; s.detail = 'Not a working day'; }
      else if (s.start < h[0] || s.end > h[1]) { s.problem = 'outside_hours'; s.detail = `Outside your hours (${hhmm(h[0])}–${hhmm(h[1])})`; }
      else if (block) { s.problem = 'blocked'; s.detail = block.reason; }
      else if (clash) { s.problem = 'clash'; s.detail = `Clashes with ${clash.client} at ${hhmm(clash.start)}`; }
      else if (tight) { s.problem = 'travel'; s.detail = `Not enough time to get from ${tight.location} (${travel(tight.location, s.location)} min)`; }
      out.push(s);
      if (!s.problem) { placed.push(s); used[p.client] = (used[p.client] ?? 0) + 1; }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Booking states. Nothing is confirmed until Kyle confirms it, unless he has
// switched on automatic confirmation for that client.
// ---------------------------------------------------------------------------
export type State = 'proposed' | 'awaiting_client' | 'change_requested' | 'awaiting_coach' | 'confirmed' | 'declined' | 'cancelled';
export type Event = 'send' | 'client_accept' | 'client_request_change' | 'coach_offer_time' | 'coach_approve' | 'coach_decline' | 'cancel';

const MOVES: Record<State, Partial<Record<Event, State>>> = {
  proposed: { send: 'awaiting_client', cancel: 'cancelled' },
  awaiting_client: { client_accept: 'awaiting_coach', client_request_change: 'change_requested', cancel: 'cancelled' },
  change_requested: { coach_approve: 'confirmed', coach_offer_time: 'awaiting_client', coach_decline: 'awaiting_client', cancel: 'cancelled' },
  awaiting_coach: { coach_approve: 'confirmed', coach_decline: 'declined', cancel: 'cancelled' },
  confirmed: { cancel: 'cancelled', client_request_change: 'change_requested' },
  declined: {},
  cancelled: {},
};

export function nextState(state: State, event: Event, opts: { autoConfirm?: boolean } = {}): State {
  const to = MOVES[state][event];
  if (!to) throw new Error(`Can't ${event} a booking that is ${state}`);
  return to === 'awaiting_coach' && opts.autoConfirm ? 'confirmed' : to;
}

export const STATE_LABEL: Record<State, string> = {
  proposed: 'Proposed', awaiting_client: 'Awaiting client', change_requested: 'Change requested',
  awaiting_coach: 'Awaiting you', confirmed: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled',
};

// Cancelling inside the notice period counts the session as used.
export function cancellationOutcome(sessionStartMs: number, cancelAtMs: number, noticeHours = 24): 'free' | 'counts_as_used' {
  return sessionStartMs - cancelAtMs >= noticeHours * 3600_000 ? 'free' : 'counts_as_used';
}
