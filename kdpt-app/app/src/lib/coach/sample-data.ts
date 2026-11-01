// Sample data for the coach portal in demo mode. Each export is what a
// database query will return once Supabase is connected.

export type Tint = 'mint' | 'amber' | 'violet' | 'sky' | 'coral' | 'grey';
export const tint = (c: Tint): [string, string] => ({
  mint: ['rgba(126,213,151,.14)', 'var(--mint)'], amber: ['rgba(255,180,94,.14)', 'var(--amber)'], violet: ['rgba(169,155,255,.14)', 'var(--violet)'],
  sky: ['rgba(110,198,255,.14)', 'var(--sky)'], coral: ['rgba(255,107,94,.14)', 'var(--coral)'], grey: ['var(--s3)', 'var(--fg2)'],
} as Record<Tint, [string, string]>)[c];

export type Client = { id: string; name: string; ini: string; hue: number; type: 'In-person' | 'Hybrid' | 'Online'; pkg: string; prog: string; adh: number; last: string; status: [Tint, string] };
export const CLIENTS: Client[] = [
  { id: 'sarah', name: 'Sarah Mitchell', ini: 'SM', hue: 145, type: 'Hybrid', pkg: '8 PT / month', prog: 'Strength Block 1 · wk 6', adh: 92, last: 'Today', status: ['coral', 'Pain reported'] },
  { id: 'tom', name: 'Tom Reid', ini: 'TR', hue: 30, type: 'In-person', pkg: '8 PT / month', prog: 'Hypertrophy · wk 3', adh: 48, last: '9 days ago', status: ['amber', 'Missed workouts'] },
  { id: 'priya', name: 'Priya Shah', ini: 'PS', hue: 260, type: 'Online', pkg: 'Online coaching', prog: '10k + Strength · wk 9', adh: 88, last: 'Yesterday', status: ['amber', 'Awaiting reply'] },
  { id: 'dave', name: 'Dave Collins', ini: 'DC', hue: 200, type: 'Online', pkg: 'Online coaching', prog: 'Fat Loss Phase 2 · wk 4', adh: 79, last: 'Today', status: ['grey', 'Meals to review'] },
  { id: 'ellie', name: 'Ellie Brooks', ini: 'EB', hue: 330, type: 'Hybrid', pkg: '4 PT / month', prog: 'Return to Training · wk 2', adh: 70, last: '2 days ago', status: ['violet', 'Low sleep'] },
  { id: 'mark', name: 'Mark Hughes', ini: 'MH', hue: 100, type: 'In-person', pkg: '8 PT / month (duo)', prog: 'Strength Block 2 · wk 1', adh: 95, last: 'Today', status: ['mint', 'On track'] },
  { id: 'jen', name: 'Jen Hughes', ini: 'JH', hue: 50, type: 'In-person', pkg: '8 PT / month (duo)', prog: 'Strength Block 2 · wk 1', adh: 93, last: 'Today', status: ['mint', 'On track'] },
  { id: 'ray', name: 'Ray Patel', ini: 'RP', hue: 180, type: 'Online', pkg: 'Online coaching', prog: 'Full Body 3x · wk 5', adh: 84, last: 'Yesterday', status: ['mint', 'On track'] },
];
export const byId = (id: string) => CLIENTS.find(c => c.id === id) ?? CLIENTS[0];
// Chosen by each client at onboarding.
export const CHECKIN: Record<string, string> = { sarah: 'Weekly · Sun', tom: 'Monthly', priya: 'Weekly · Mon', dave: 'Weekly · Sun', ellie: 'Every 2 weeks · Sun', mark: 'Monthly', jen: 'Monthly', ray: 'Every 2 weeks · Fri' };
// Payment status for a client, from the same record the Payments page uses.
export const payFor = (id: string): [Tint, string] => { const b = BILLING.find(x => x[0] === id); return b ? [b[3] === 'paid' ? 'mint' : b[3] === 'overdue' ? 'coral' : 'grey', b[5]] : ['grey', 'No payment set up']; };

export type LibEx = { id: string; name: string; pat: string; kit: string; c: Tint; filmed: boolean };
export const LIB: LibEx[] = [
  { id: 'lp', name: 'Leg Press', pat: 'Squat', kit: 'Machine', c: 'mint', filmed: true },
  { id: 'hs', name: 'Hack Squat', pat: 'Squat', kit: 'Machine', c: 'mint', filmed: true },
  { id: 'gs', name: 'Goblet Squat', pat: 'Squat', kit: 'Dumbbell', c: 'mint', filmed: true },
  { id: 'bs', name: 'Box Squat', pat: 'Squat', kit: 'Bodyweight', c: 'mint', filmed: false },
  { id: 'rdl', name: 'Romanian Deadlift', pat: 'Hinge', kit: 'Barbell', c: 'amber', filmed: true },
  { id: 'drdl', name: 'Dumbbell RDL', pat: 'Hinge', kit: 'Dumbbell', c: 'amber', filmed: false },
  { id: 'ht', name: 'Hip Thrust', pat: 'Hinge', kit: 'Barbell', c: 'amber', filmed: true },
  { id: 'lun', name: 'Walking Lunge', pat: 'Lunge', kit: 'Dumbbell', c: 'sky', filmed: true },
  { id: 'ss', name: 'Split Squat', pat: 'Lunge', kit: 'Dumbbell', c: 'sky', filmed: false },
  { id: 'su', name: 'Step-up', pat: 'Lunge', kit: 'Dumbbell', c: 'sky', filmed: false },
  { id: 'lc', name: 'Seated Leg Curl', pat: 'Isolation', kit: 'Machine', c: 'violet', filmed: true },
  { id: 'cr', name: 'Calf Raise', pat: 'Isolation', kit: 'Machine', c: 'violet', filmed: false },
  { id: 'db', name: 'Dead Bug', pat: 'Core', kit: 'Bodyweight', c: 'coral', filmed: false },
  { id: 'pl', name: 'Plank', pat: 'Core', kit: 'Bodyweight', c: 'coral', filmed: true },
];
export const lib = (id: string) => LIB.find(x => x.id === id) ?? LIB[0];
export const EXTRA: Record<string, { inc: number; muscles: string; cues: string[]; swaps: string[] }> = {
  lp: { inc: 10, muscles: 'Quads, glutes', cues: ['Feet shoulder-width, mid-platform', 'Lower until knees reach about 90°', 'Push through the whole foot, don\'t lock out'], swaps: ['hs', 'gs', 'bs'] },
};

// A row in a programme. last = last session's result [kg, reps per set]; inc = load jump.
export type Row = { ex: string; sets: number; r: [number, number]; rest: number; prio: number; last: [number, number[]]; inc: number };
export const PRIO = ['Must', 'If time', 'Cut first'];
export const SARAH_PLAN: Record<string, Row[]> = {
  'Lower A': [
    { ex: 'lp', sets: 3, r: [10, 12], rest: 120, prio: 0, last: [120, [12, 12, 12]], inc: 10 },
    { ex: 'rdl', sets: 3, r: [8, 10], rest: 120, prio: 0, last: [60, [10, 9, 8]], inc: 2.5 },
    { ex: 'lun', sets: 3, r: [10, 10], rest: 90, prio: 1, last: [12, [10, 10, 10]], inc: 2 },
    { ex: 'lc', sets: 3, r: [12, 15], rest: 75, prio: 1, last: [40, [15, 14, 13]], inc: 5 },
    { ex: 'cr', sets: 2, r: [15, 20], rest: 60, prio: 2, last: [50, [20, 18]], inc: 5 },
    { ex: 'db', sets: 2, r: [10, 10], rest: 45, prio: 2, last: [0, [10, 10]], inc: 0 },
  ],
  'Upper A': [{ ex: 'pl', sets: 3, r: [30, 45], rest: 60, prio: 2, last: [0, [45, 40, 40]], inc: 0 }],
  'Lower B': [
    { ex: 'ht', sets: 4, r: [8, 10], rest: 120, prio: 0, last: [80, [10, 10, 10, 10]], inc: 5 },
    { ex: 'gs', sets: 3, r: [10, 12], rest: 90, prio: 1, last: [20, [12, 11, 10]], inc: 2 },
  ],
  'Upper B': [],
};
export const planMinutes = (rows: Row[]) => Math.round(rows.reduce((m, x) => m + 1.25 + (x.sets * 50 + (x.sets - 1) * x.rest) / 60 + 1, 0) + 8);

// Things that need Kyle. Urgency: 1 = today (safety, money), 2 = this week,
// 3 = when there's time. A missed workout is never an emergency on its own.
export type AlertKind = 'pain' | 'missed' | 'reply' | 'meals' | 'payment' | 'checkin' | 'block' | 'renewal';
export type Alert = { id: string; c: string; kind: AlertKind; urgency: 1 | 2 | 3; tag: [Tint, string, string]; why: string; when: string };
export const ALERTS: Alert[] = [
  { id: 'a1', c: 'sarah', kind: 'pain', urgency: 1, tag: ['coral', 'pain', 'Pain · knee 4/10'], why: 'During leg press this morning. Swapped to box squat and finished.', when: 'Today 07:42' },
  { id: 'a6', c: 'dave', kind: 'payment', urgency: 1, tag: ['coral', 'card', 'Payment overdue'], why: '£120 was due 18 Oct by bank transfer. Reminders sent 15 and 18 Oct.', when: '13 days' },
  { id: 'a5', c: 'ellie', kind: 'checkin', urgency: 2, tag: ['violet', 'clip', 'Check-in'], why: 'Feeling low and asked for a call with you. Sleep 2/5 for the second week running.', when: 'Sun 19:10' },
  { id: 'a3', c: 'priya', kind: 'reply', urgency: 2, tag: ['amber', 'messages', 'Awaiting reply'], why: 'Handed over by KAI: “Can I train legs the day after my 10k?”', when: '26 h ago' },
  { id: 'a2', c: 'tom', kind: 'missed', urgency: 3, tag: ['amber', 'clock', 'Behind on training'], why: 'No workout for 9 days. His usual gap is 2–3.', when: '9 days' },
  { id: 'a4', c: 'dave', kind: 'meals', urgency: 3, tag: ['grey', 'fuel', 'Meals to review'], why: '6 meals since Thursday, none reviewed.', when: 'Since Thu' },
  { id: 'a7', c: 'sarah', kind: 'block', urgency: 3, tag: ['mint', 'programmes', 'Block ends soon'], why: 'Strength Block 1 finishes in 2 weeks. Plan what comes next.', when: 'Week 6 of 8' },
  { id: 'a8', c: 'ellie', kind: 'renewal', urgency: 3, tag: ['sky', 'card', 'Block of 4 ending'], why: 'Her last session of this block is Wednesday. Ask if she wants another 4.', when: 'Wed' },
];
export const URGENCY = { 1: 'Today', 2: 'This week', 3: 'When you have time' } as const;

export const APPROVALS: { id: string; c: string; kind: [Tint, string]; text: string }[] = [
  { id: 'p1', c: 'dave', kind: ['amber', 'Nutrition feedback'], text: 'Good consistency this week, Dave. Protein is low at lunch (~25g). Add a chicken pot or Greek yoghurt to get closer to 150g.' },
  { id: 'p2', c: 'sarah', kind: ['mint', 'Programme change'], text: 'Replace Leg Press with Box Squat in Lower A for 2 weeks, then review.' },
  { id: 'p3', c: 'priya', kind: ['violet', 'Message reply'], text: 'Keep it light the day after. Swap Thursday to upper body and move legs to Saturday.' },
];
export const TODAY: [string, string, string, Tint][] = [['07:00', 'sarah', 'Studio', 'mint'], ['09:30', 'mark', 'Studio · duo with Jen', 'mint'], ['12:15', 'ellie', 'Online check-in call', 'violet'], ['17:45', 'tom', 'Gym', 'sky']];

// Sarah's last 7 days from her food log: kcal, protein, carbs, fat (null = nothing logged).
export const WEEK_LOG: [string, number | null, number?, number?, number?][] = [['Mon 13', 2050, 142, 205, 68], ['Tue 14', 1890, 131, 190, 66], ['Wed 15', 2210, 118, 240, 80], ['Thu 16', 1760, 138, 160, 58],
  ['Fri 17', 2400, 104, 260, 92], ['Sat 18', null], ['Sun 19', 1980, 135, 198, 70]];
export const MEAL_PHOTOS: [string, string, string][] = [['breakfast', 'Breakfast · Mon', '32g protein'], ['wrap', 'Lunch · Tue', '38g protein'], ['wrap', 'Lunch · Mon', '41g protein'], ['pasta', 'Dinner · Mon', '45g protein'], ['potato-bowl', 'Dinner · Tue', '42g protein'], ['turkey-pasta', 'Lunch · Wed', '40g protein']];
export const TIMELINE: [string, Tint, string, string, string][] = [['train', 'mint', 'Lower Body A completed', '47 min · Leg Press +10 kg', 'Today 07:58'], ['pain', 'coral', 'Pain reported · left knee 4/10', 'Swapped to Box Squat', 'Today 07:42'],
  ['fuel', 'amber', 'Lunch logged', 'Chicken wrap · 41g protein', 'Mon 12:40'], ['clip', 'violet', 'Weekly check-in', 'Energy 4 · Sleep 4 · Stress 2', 'Sun 19:10'], ['schedule', 'sky', 'PT session booked', 'Thu 22 Oct · 7:00 · Studio', 'Sun 18:02']];
export const CHECKIN_ROWS: [string, [string, Tint], string, string[], Record<string, [number, Tint]>, [Tint, string]][] = [
  ['Sun 19 Oct', ['Good', 'sky'], 'Busy week at work, but training felt great. Knee a bit tight on lunges.', ['Clothes fit better', 'Lifting heavier', 'More energy'], { Energy: [4, 'mint'], Sleep: [4, 'violet'], Stress: [2, 'coral'], Motivation: [5, 'sky'] }, ['amber', 'More accountability']],
  ['Sun 12 Oct', ['Okay', 'grey'], 'Long hours, ate on the go a lot.', ['Stuck to my plan'], { Energy: [3, 'mint'], Sleep: [3, 'violet'], Stress: [3, 'coral'], Motivation: [4, 'sky'] }, ['amber', 'Help with food']],
  ['Sun 5 Oct', ['Great', 'mint'], 'Best week in ages. Jeans I haven\'t worn since last year fit again!', ['Clothes fit better', 'Feeling confident', 'Better mood'], { Energy: [5, 'mint'], Sleep: [4, 'violet'], Stress: [2, 'coral'], Motivation: [5, 'sky'] }, ['mint', 'Keep things as they are']],
  ['Sun 28 Sep', ['Low', 'amber'], 'Bad sleep, new puppy.', [], { Energy: [2, 'mint'], Sleep: [2, 'violet'], Stress: [4, 'coral'], Motivation: [3, 'sky'] }, ['sky', 'Just a bit of encouragement']],
];

export const PROGRAMMES: [string, string, number, Tint][] = [['Strength Block 1', '8 weeks · 4 days', 6, 'mint'], ['Hypertrophy', '10 weeks · 5 days', 4, 'amber'], ['Fat Loss Phase 1', '6 weeks · 3 days', 9, 'coral'], ['Return to Training', '4 weeks · 2 days', 3, 'violet'], ['10k + Strength', '12 weeks · 3 days', 2, 'sky'], ['Full Body 3x', '8 weeks · 3 days', 7, 'grey']];
export type Template = { name: string; weeks: number; goal: string; clients: string[]; days: Record<string, Row[]> };
export const TEMPLATES: Record<string, Omit<Template, 'name'>> = {
  'Strength Block 1': { weeks: 8, goal: 'Strength', clients: ['sarah', 'mark', 'jen'], days: { 'Day 1 · Lower': SARAH_PLAN['Lower A'], 'Day 2 · Upper': SARAH_PLAN['Upper A'], 'Day 3 · Lower': SARAH_PLAN['Lower B'], 'Day 4 · Upper': [] } },
};

// Schedule: week of 19 October. Busy blocks come from Google Calendar (times only).
export const DAYS: [string, number][] = [['Mon', 19], ['Tue', 20], ['Wed', 21], ['Thu', 22], ['Fri', 23], ['Sat', 24], ['Sun', 25]];
export const CAL_START = 6, CAL_END = 20, HOUR = 44;
export type CalEvent = [number, number, number, string, string, string];
export const EVENTS: CalEvent[] = [
  [0, 7, 1, 'studio', 'Sarah M', 'Studio'], [0, 12, 1.5, 'busy', 'Busy', 'Sample busy time'], [0, 18, 1, 'gym', 'Tom R', 'Gym'],
  [1, 6.5, 1, 'studio', 'Mark & Jen', 'Studio · duo'], [1, 17.5, 1, 'online', 'Ray P', 'Online'],
  [2, 9.5, 1, 'studio', 'Mark & Jen', 'Studio · duo'], [2, 12.25, 0.75, 'online', 'Ellie B', 'Online call'],
  [3, 7, 1, 'studio', 'Sarah M', 'Studio'], [3, 10.5, 1, 'online', 'Priya S', 'Online'], [3, 17.75, 1, 'gym', 'Tom R', 'Gym'],
  [4, 6.5, 1, 'studio', 'Mark & Jen', 'Studio · duo'], [4, 12, 2, 'busy', 'Busy', 'Sample busy time'], [4, 17, 1, 'pending', 'Priya S', 'Waiting for you'],
];
export const DAYNAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Working hours. The gym opens at 6:30; Wednesday is a half day; no weekends.
export const DEFAULT_HOURS: Record<string, [number, number] | null> = { Mon: [6.5, 19.5], Tue: [6.5, 19.5], Wed: [6.5, 13], Thu: [6.5, 19.5], Fri: [6.5, 19.5], Sat: null, Sun: null };
export const AVAIL = [
  { id: 'v1', c: 'tom', windows: 'Mon after 17:30 · Thu after 17:00', n: 8, draft: 'Mondays 18:00 and Thursdays 17:45, your last slots of the day, so no gaps' },
  { id: 'v2', c: 'ellie', windows: 'Wed 10:00–13:00 · online', n: 4, draft: 'Wednesdays 12:15, the last slot before your half day ends' },
  { id: 'v3', c: 'priya', windows: 'Tue or Thu mornings · online', n: 4, draft: 'Thursdays 10:30, keeping your Thursday mornings together after Sarah at 7:00' },
];
export const REQS = [
  { id: 'r1', c: 'sarah', from: 'Thu 5 Nov · 7:00', to: 'Fri 6 Nov · 7:30', note: 'Early meeting on Thursday' },
  { id: 'r2', c: 'tom', from: 'Thu 5 Nov · 17:45', to: 'Fri 6 Nov · 17:45', note: 'Late meeting at work' },
];
// Bookings clients have sent back. They stay pending until approved.
export const APPROVE = [
  { id: 'b1', c: 'sarah', what: 'Accepted 7 of 8 November sessions (Mon and Thu 7:00). One change request below.', okBtn: 'Confirm 7', ok: '7 confirmed · Sarah notified', review: true },
  { id: 'b2', c: 'priya', what: 'Booked Fri 23 Oct · 17:00 · online (extra session from her allowance)', okBtn: 'Confirm', ok: 'Confirmed · Priya notified', review: false },
  { id: 'b3', c: 'ellie', what: 'Accepted all 4 November sessions (Wed 12:15 online)', okBtn: 'Confirm 4', ok: '4 confirmed · Ellie notified', review: true },
];
export const hhmm = (h: number) => `${Math.floor(h)}:${String(Math.round(h % 1 * 60)).padStart(2, '0')}`;

export const CONVS: [string, string, boolean][] = [['priya', '“Can I train legs the day after my 10k?”', true], ['sarah', 'Knee felt a bit tight on the lunges', true], ['tom', 'Sorry, been mad busy at work', true], ['dave', 'Thanks for the feedback!', false], ['ellie', 'See you at 12:15', false]];
export const THREADS: Record<string, [string, string][]> = {
  priya: [['them', 'Hey Kyle, race is Sunday!'], ['sys', 'KAI handed this over: race-day advice is your call'], ['them', 'Can I train legs the day after my 10k?']],
  sarah: [['me', 'Great session Monday. Leg press goes up today 💪'], ['them', 'Knee felt a bit tight on the lunges'], ['sys', 'KAI handed this over: pain is always yours'], ['them', 'My knee aches during lunges. Can you take a look?']],
  tom: [['me', 'All good Tom? Not seen a workout in a while'], ['them', 'Sorry, been mad busy at work']],
  dave: [['me', 'Feedback is in your Fuel tab'], ['them', 'Thanks for the feedback!']],
  ellie: [['them', 'See you at 12:15']],
};

export const RECIPES: [string, string, number][] = [['pasta', 'Creamy Cajun Chicken Pasta', 45], ['potato-bowl', 'Big Mac Loaded Potato Bowl', 42], ['wrap', 'High-Protein Breakfast Wrap', 41], ['turkey-pasta', 'Turkey & Pasta Tomato Bowl', 40], ['breakfast', 'Eggs, Veg & Sourdough', 32]];
export const MODERATION: [string, string, string, string][] = [['m1', 'priya', 'Thank you! Legs held up so much better this time', '2 h · comment'], ['m2', 'mark', 'Training with Jen. No skipping when someone\'s waiting for you 😂', 'Mon · answer'], ['m3', 'tom', 'Made the Big Mac bowl twice already', 'Thu · comment']];

// Monthly packages. Each client's own price is stored on their subscription,
// so a package price change only reaches existing clients when Kyle chooses.
export type Package = { id: string; name: string; sub: string; price: number | null; duo?: boolean };
export const PACKAGES: Package[] = [
  { id: 'pt2', name: '2 PT sessions', sub: 'a month · in person', price: 90 },
  { id: 'pt4', name: '4 PT sessions', sub: 'a month · in person', price: 150 },
  { id: 'pt8', name: '8 PT sessions', sub: 'a month · in person', price: 260 },
  { id: 'online', name: 'Online coaching', sub: 'a month', price: 120 },
  // One price for the pair. Either one person pays, or it's split 50/50.
  { id: 'duo8', name: '8 PT sessions · duo', sub: 'a month · for two', price: null, duo: true },
];
export const PARTNER: Record<string, string> = { mark: 'Jen', jen: 'Mark' };
// [client, package, monthly price, status, how and when they pay, status label]
// Clients don't all pay the same way or on the same day.
export type Billing = [string, string, number | null, 'paid' | 'due' | 'overdue', string, string];
export const BILLING: Billing[] = [['sarah', 'pt8', 260, 'paid', 'Bank transfer · 1st', 'Paid 1 Oct'], ['tom', 'pt8', 240, 'due', 'Bank transfer · 25th', 'Due 25 Oct'],
  ['priya', 'online', 120, 'paid', 'Bank transfer · 8th', 'Paid 8 Oct'], ['dave', 'online', 120, 'overdue', 'Bank transfer · 18th', 'Overdue since 18 Oct'],
  ['ellie', 'pt4', 140, 'due', 'Pays per block of 4', 'Block ends 30 Oct'], ['mark', 'duo8', null, 'paid', 'Mark pays both · 1st', 'Paid 1 Oct'],
  ['jen', 'duo8', null, 'paid', 'Paid by Mark', 'Paid 1 Oct'], ['ray', 'online', 120, 'paid', 'Cash at session', 'Paid 12 Oct']];
export const pkgById = (id: string) => PACKAGES.find(p => p.id === id) ?? PACKAGES[0];
export const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

export const RULES: [string, string, Tint, string, string, string][] = [['prog', 'arrowup', 'mint', 'Progression', 'Add one load jump when every working set hits the top of the range', 'Auto'],
  ['alert', 'pain', 'coral', 'Missed-workout alert', 'Flag a client when their gap is twice their usual', 'Auto'],
  ['release', 'calup', 'sky', 'Booking release', 'Open next month on the 20th at 18:00, regular slots first', 'Auto'],
  ['remind', 'clip', 'violet', 'Check-in reminder', 'On each client\'s chosen day and frequency, 09:00, again at 18:00 if not done', 'Auto'],
  ['payRemind', 'card', 'amber', 'Payment reminders', '3 days before, on the day, then every 3 days until paid. Alert me after 3 days', 'Auto'],
  ['sessRemind', 'bell', 'sky', 'Session reminders', 'The evening before, with the cancellation cut-off', 'Auto'],
  ['drop', 'community', 'violet', 'Community posts', 'Question of the week Monday 07:00; tip and 3 meals Wednesday 07:00', 'Auto'],
  ['aiAnswer', 'messages', 'violet', 'KAI answers', 'Questions about the client\'s own plan. Pain, injury and plan changes come to you', 'Auto'],
  ['aiDraft', 'spark', 'violet', 'KAI drafts', 'Programme changes, nutrition feedback, replies and weekly tips', 'Needs approval']];

// Check-in builder
export const QTYPES: Record<string, [string, string, Tint]> = { mood: ['Mood slider', 'sun', 'violet'], scale: ['1–5 scale', 'progress', 'mint'], text: ['Written answer', 'messages', 'sky'], pick: ['Tick any', 'check', 'amber'], number: ['Number', 'weight', 'grey'], photo: ['Photos', 'camera', 'coral'] };
export type Question = { id: string; step: string; q: string; type: string; req: boolean; mom?: boolean; ends?: [string, string]; opts?: string[] };
export const CHECKIN_FORM: Question[] = [
  { id: 'q1', step: 'How you feel', q: 'How are you feeling overall?', type: 'mood', req: true, mom: true },
  { id: 'q2', step: 'How you feel', q: 'Describe your week in a few words', type: 'text', req: false },
  { id: 'q3', step: 'Your week', q: 'Sleep', type: 'scale', req: true, mom: true, ends: ['Poor', 'Great'] },
  { id: 'q4', step: 'Your week', q: 'Energy', type: 'scale', req: true, mom: true, ends: ['Flat', 'Buzzing'] },
  { id: 'q5', step: 'Your week', q: 'Stress', type: 'scale', req: true, mom: true, ends: ['Calm', 'Maxed out'] },
  { id: 'q6', step: 'Your week', q: 'How was your food?', type: 'scale', req: true, mom: true, ends: ['Off track', 'Spot on'] },
  { id: 'q7', step: 'Wins', q: 'What went well?', type: 'pick', req: false, opts: ['Clothes fit better', 'More energy', 'Sleeping better', 'Lifting heavier', 'Feeling confident', 'Stuck to my plan'] },
  { id: 'q8', step: 'Wins', q: 'Progress photos', type: 'photo', req: false },
  { id: 'q9', step: 'Wins', q: 'Waist (cm)', type: 'number', req: false },
  { id: 'q10', step: 'Support', q: 'What would help most next week?', type: 'pick', req: true, opts: ['Keep things as they are', 'More accountability', 'Help with food', 'Change my training', 'A call with my coach'] },
  { id: 'q11', step: 'Support', q: 'Anything else for your coach?', type: 'text', req: false },
];
export const CHECKIN_STEPS = ['How you feel', 'Your week', 'Wins', 'Support'];

// Regular weekly slots, used to build each month's proposed sessions.
// Weekday: Monday = 0. Clients whose times change send availability instead.
export const REGULAR: { client: string; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; time: string; minutes: number; location: string }[] = [
  { client: 'sarah', weekday: 0, time: '7:00', minutes: 60, location: 'Studio' }, { client: 'sarah', weekday: 3, time: '7:00', minutes: 60, location: 'Studio' },
  { client: 'mark', weekday: 1, time: '6:30', minutes: 60, location: 'Studio' }, { client: 'mark', weekday: 4, time: '6:30', minutes: 60, location: 'Studio' },
  { client: 'tom', weekday: 0, time: '18:00', minutes: 60, location: 'Gym' }, { client: 'tom', weekday: 3, time: '17:45', minutes: 60, location: 'Gym' },
  { client: 'ray', weekday: 1, time: '17:30', minutes: 45, location: 'Online' },
];
export const ALLOWANCE: Record<string, number> = { sarah: 8, mark: 8, tom: 8, ray: 4 };
export const SENDS_AVAILABILITY = ['ellie', 'priya'];
// Minutes to travel between locations. Online needs none.
export const TRAVEL: Record<string, number> = { 'Studio>Gym': 20, 'Gym>Studio': 20 };
// Time off already in the diary for November.
export const NOV_TIME_OFF: { date: string; start: number; end: number; reason: string }[] = [
  { date: '2026-11-13', start: 0, end: 24 * 60, reason: 'Course day (blocked by you)' },
];

// Client record details (sample).
export const CONTACT: Record<string, { email: string; phone: string; since: string; emergency: string; goal: string; health: [Tint, string][] }> = {
  sarah: { email: 'sarah.m@example.com', phone: '07700 900123', since: 'September 2026', emergency: 'Tom Mitchell · 07700 900456', goal: 'Get stronger',
    health: [['amber', 'Left knee: patellar pain history'], ['mint', 'Health questions: all clear (6 Sep)']] },
};
export const contactFor = (id: string) => CONTACT[id] ?? { email: `${id}@example.com`, phone: '07700 900000', since: '2026', emergency: 'Not given', goal: 'General fitness', health: [['mint', 'Health questions: all clear']] as [Tint, string][] };
// [date, time, location, state]
export const SESSION_HISTORY: [string, string, string, 'confirmed' | 'completed' | 'late_cancelled' | 'awaiting_coach' | 'change_requested'][] = [
  ['Thu 5 Nov', '7:00', 'Studio', 'change_requested'], ['Mon 2 Nov', '7:00', 'Studio', 'awaiting_coach'], ['Thu 22 Oct', '7:00', 'Studio', 'confirmed'],
  ['Mon 19 Oct', '7:00', 'Studio', 'completed'], ['Thu 15 Oct', '7:00', 'Studio', 'completed'], ['Mon 12 Oct', '7:00', 'Studio', 'late_cancelled'], ['Thu 8 Oct', '7:00', 'Studio', 'completed'],
];
export const PAYMENT_HISTORY: [string, string, string, 'paid' | 'due' | 'overdue'][] = [
  ['1 Nov', '£260', 'November · 8 PT', 'due'], ['1 Oct', '£260', 'October · 8 PT', 'paid'], ['1 Sep', '£260', 'September · 8 PT', 'paid'],
];
