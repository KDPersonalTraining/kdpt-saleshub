// Sample data for demo mode. Every export here is what a database query will
// return once Supabase is connected; screens only read through these shapes.
import type { Priority } from '@/lib/rules';

export type Exercise = {
  id: string; name: string; sets: number; reps: [number, number]; rest: number; inc: number;
  priority: Priority; setup: number; kit: 'machine' | 'dumbbell' | 'barbell' | 'body';
  last: { load: number; reps: number[] }; alts: [string, string, string][];
};

export const WORKOUT: { name: string; exercises: Exercise[] } = {
  name: 'Lower Body A',
  exercises: [
    { id: 'lp', name: 'Leg Press', sets: 3, reps: [10, 12], rest: 120, inc: 10, priority: 'must_keep', setup: 1.5, kit: 'machine',
      last: { load: 120, reps: [12, 12, 12] },
      alts: [['Hack Squat', 'Same pattern · start 70kg', 'machine'], ['Goblet Squat', 'If machines are busy · 24kg', 'dumbbell'], ['Box Squat', 'Easier on the knees', 'body']] },
    { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: [8, 10], rest: 120, inc: 2.5, priority: 'must_keep', setup: 1.5, kit: 'dumbbell',
      last: { load: 60, reps: [10, 9, 8] },
      alts: [['Dumbbell RDL', 'Same pattern · 2 × 24kg', 'dumbbell'], ['Cable Pull-through', 'Lighter on the lower back', 'machine']] },
    { id: 'lun', name: 'Walking Lunge', sets: 3, reps: [10, 10], rest: 90, inc: 2, priority: 'keep_if_time', setup: 1, kit: 'dumbbell',
      last: { load: 12, reps: [10, 10, 10] },
      alts: [['Split Squat', 'Stationary · easier balance', 'dumbbell'], ['Step-up', 'Knee-friendly', 'body']] },
    { id: 'lc', name: 'Seated Leg Curl', sets: 3, reps: [12, 15], rest: 75, inc: 5, priority: 'keep_if_time', setup: 1, kit: 'machine',
      last: { load: 40, reps: [15, 14, 13] },
      alts: [['Lying Leg Curl', 'Same muscles', 'machine'], ['Swiss Ball Curl', 'No machine needed', 'body']] },
    { id: 'cr', name: 'Calf Raise', sets: 2, reps: [15, 20], rest: 60, inc: 5, priority: 'first_to_cut', setup: 0.5, kit: 'machine',
      last: { load: 50, reps: [20, 18] }, alts: [] },
    { id: 'db', name: 'Dead Bug', sets: 2, reps: [10, 10], rest: 45, inc: 0, priority: 'first_to_cut', setup: 0.5, kit: 'body',
      last: { load: 0, reps: [10, 10] }, alts: [] },
  ],
};

export const PROGRAMME = { name: 'Strength Block 1', week: 6, weeks: 8,
  days: [['Lower Body A', 'today'], ['Upper Body A', 'done', '6 exercises · 52 min'], ['Lower Body B', '', '5 exercises · 45 min'], ['Upper Body B', '', '6 exercises · 50 min']] as [string, string, string?][] };

// [date, workout, minutes, [[exercise, [[kg, reps], ...]], ...], records set]
export type HistoryRow = [string, string, number, [string, [number, number][]][], number];
export const HISTORY: HistoryRow[] = [
  ['Mon 19 Oct', 'Lower Body A', 58, [['Leg Press', [[130, 10], [130, 10], [130, 9]]], ['Romanian Deadlift', [[60, 10], [60, 9], [60, 8]]], ['Walking Lunge', [[12, 10], [12, 10], [12, 10]]], ['Seated Leg Curl', [[40, 15], [40, 14], [40, 13]]]], 2],
  ['Tue 20 Oct', 'Upper Body A', 52, [['Lat Pulldown', [[42.5, 12], [42.5, 11], [42.5, 10]]], ['Hip Thrust', [[80, 12], [80, 11], [80, 10]]], ['DB Shoulder Press', [[14, 10], [14, 9], [14, 8]]], ['Seated Row', [[45, 12], [45, 12], [45, 11]]]], 2],
  ['Thu 15 Oct', 'Lower Body B', 47, [['Hip Thrust', [[80, 10], [80, 10], [80, 9]]], ['Goblet Squat', [[24, 12], [24, 12], [24, 10]]], ['Leg Extension', [[35, 15], [35, 14]]]], 1],
  ['Tue 13 Oct', 'Lower Body A', 61, [['Leg Press', [[120, 12], [120, 12], [120, 12]]], ['Romanian Deadlift', [[57.5, 10], [57.5, 10], [57.5, 9]]], ['Walking Lunge', [[12, 10], [12, 10], [12, 10]]]], 0],
  ['Mon 12 Oct', 'Upper Body A', 50, [['Lat Pulldown', [[42.5, 10], [42.5, 9], [40, 10]]], ['DB Shoulder Press', [[14, 9], [14, 8], [12, 10]]], ['Seated Row', [[45, 12], [45, 11], [45, 10]]]], 1],
];

export const PATTERNS: [string, string, string, string][] = [['all', 'All', 'layers', 'var(--fg2)'], ['squat', 'Squat', 'train', 'var(--mint)'], ['hinge', 'Hinge', 'weight', 'var(--amber)'], ['push', 'Push', 'up', 'var(--coral)'],
  ['pull', 'Pull', 'down', 'var(--sky)'], ['lunge', 'Lunge', 'body', 'var(--violet)'], ['core', 'Core', 'flame', 'var(--amber)']];

export type LibraryExercise = { id: string; name: string; pattern: string; kit: keyof typeof KIT; muscles: string; cues: string[]; swaps: string[]; filmed: boolean };
const ex = (id: string, name: string, pattern: string, kit: keyof typeof KIT, muscles: string, cues: string[], swaps: string[]): LibraryExercise => ({ id, name, pattern, kit, muscles, cues, swaps, filmed: false });
export const KIT = { machine: ['Machine', 'machine'], dumbbell: ['Dumbbells', 'weight'], barbell: ['Barbell', 'train'], body: ['Bodyweight', 'body'] } as const;
export const EXLIB: LibraryExercise[] = [
  ex('lp', 'Leg Press', 'squat', 'machine', 'Quads, glutes', ['Feet shoulder-width, mid-platform', 'Lower until knees reach about 90°', 'Push through the whole foot, don\'t lock out'], ['Hack Squat', 'Goblet Squat', 'Box Squat']),
  ex('gs', 'Goblet Squat', 'squat', 'dumbbell', 'Quads, glutes, core', ['Hold the dumbbell at your chest', 'Sit between your heels, chest tall', 'Drive up through mid-foot'], ['Box Squat', 'Leg Press']),
  ex('hs', 'Hack Squat', 'squat', 'machine', 'Quads', ['Back flat on the pad', 'Control the way down for 2 seconds', 'Stop just short of lockout'], ['Leg Press']),
  ex('rdl', 'Romanian Deadlift', 'hinge', 'dumbbell', 'Hamstrings, glutes', ['Soft knees, push your hips back', 'Bar stays close to your legs', 'Stop when your hamstrings are tight, not your back'], ['Dumbbell RDL', 'Cable Pull-through']),
  ex('ht', 'Hip Thrust', 'hinge', 'barbell', 'Glutes', ['Upper back on the bench edge', 'Chin tucked, ribs down', 'Squeeze at the top for a second'], ['Glute Bridge', 'Cable Kickback']),
  ex('sp', 'DB Shoulder Press', 'push', 'dumbbell', 'Shoulders, triceps', ['Sit tall, back against the pad', 'Press up and slightly in', 'Lower to ear height'], ['Machine Shoulder Press', 'Landmine Press']),
  ex('pu', 'Incline Push-up', 'push', 'body', 'Chest, triceps', ['Hands on a bench, body in one line', 'Lower your chest to the bench', 'Push the floor away'], ['Push-up', 'DB Bench Press']),
  ex('lpd', 'Lat Pulldown', 'pull', 'machine', 'Back, biceps', ['Grip just outside shoulder-width', 'Pull elbows down to your ribs', 'Control it back up'], ['Assisted Pull-up', 'Single-arm Pulldown']),
  ex('sr', 'Seated Row', 'pull', 'machine', 'Mid back', ['Chest up, shoulders down', 'Pull to your belly button', 'Pause, then let your shoulders reach forward'], ['DB Row', 'Chest-supported Row']),
  ex('wl', 'Walking Lunge', 'lunge', 'dumbbell', 'Quads, glutes', ['Long step, back knee towards the floor', 'Front knee follows your toes', 'Push through the front heel'], ['Split Squat', 'Step-up']),
  ex('ss', 'Split Squat', 'lunge', 'dumbbell', 'Quads, glutes', ['Stay in one place, feet hip-width apart', 'Drop straight down', 'Most weight through the front foot'], ['Step-up']),
  ex('dbg', 'Dead Bug', 'core', 'body', 'Deep core', ['Lower back pressed into the floor', 'Opposite arm and leg go out together', 'Breathe out as you reach'], ['Plank']),
  ex('pl', 'Plank', 'core', 'body', 'Core, shoulders', ['Elbows under shoulders', 'Squeeze glutes, ribs down', 'Stop when your hips drop'], ['Dead Bug']),
];
export const patternOf = (k: string) => PATTERNS.find(p => p[0] === k) ?? PATTERNS[0];

// Every logged top set for the main lifts: [date, kg, reps].
export const LIFTS: Record<string, [string, number, number][]> = {
  'Leg Press': [['1 Sep', 100, 12], ['8 Sep', 100, 12], ['15 Sep', 110, 10], ['22 Sep', 110, 12], ['29 Sep', 110, 12], ['6 Oct', 120, 11], ['13 Oct', 120, 12], ['19 Oct', 130, 10]],
  'Romanian Deadlift': [['1 Sep', 45, 10], ['8 Sep', 47.5, 10], ['15 Sep', 50, 9], ['22 Sep', 50, 10], ['29 Sep', 52.5, 10], ['6 Oct', 55, 9], ['13 Oct', 57.5, 10], ['19 Oct', 60, 10]],
  'Hip Thrust': [['3 Sep', 60, 10], ['10 Sep', 65, 10], ['17 Sep', 70, 10], ['24 Sep', 70, 10], ['1 Oct', 75, 10], ['8 Oct', 75, 10], ['15 Oct', 80, 10], ['20 Oct', 80, 12]],
  'Lat Pulldown': [['2 Sep', 35, 12], ['9 Sep', 35, 12], ['16 Sep', 37.5, 10], ['23 Sep', 37.5, 12], ['30 Sep', 40, 10], ['7 Oct', 40, 11], ['14 Oct', 42.5, 10], ['20 Oct', 42.5, 12]],
};
export const WEEKLY_TOTALS: [number, number][] = [[7, 5200], [14, 5650], [21, 6100], [28, 6300], [5, 6900], [12, 7350], [19, 7900], [26, 8420]];
export const RECORDS: [string, string, string, string, string][] = [['Leg Press', 'Heaviest weight', '130 kg × 10', '19 Oct', '+10 kg'], ['Leg Press', 'Est. 1-rep max', '173 kg', '19 Oct', '+13 kg'],
  ['Hip Thrust', 'Most reps at 80 kg', '80 kg × 12', '20 Oct', '+2 reps'], ['Lat Pulldown', 'Most reps at 42.5 kg', '42.5 kg × 12', '20 Oct', '+2 reps'],
  ['Lower Body A', 'Best session total', '8,420 kg', '19 Oct', '+520 kg']];
export const MEASUREMENTS: [string, string, string][] = [['Waist', '78 cm', '−5 cm'], ['Hips', '96 cm', '−3 cm'], ['Chest', '90 cm', '−1 cm'], ['Upper arm', '29 cm', '+0.5 cm'], ['Thigh', '55 cm', '−2 cm']];
export const WEIGHT_7DAY = [71.2, 71.0, 70.6, 70.3, 70.1, 69.6, 69.2, 69.0, 68.6, 68.3, 68.1, 67.8];
// w = workout, pt = PT session, x = missed, '' = rest
export const CONSISTENCY: [string, string][] = [['7 Sep', 'w,,w,,w,pt,'], ['14 Sep', 'w,,w,,w,pt,'], ['21 Sep', 'w,,x,,w,pt,'], ['28 Sep', 'w,pt,w,,w,,'], ['5 Oct', 'w,,w,,w,pt,'], ['12 Oct', 'w,pt,w,,w,pt,'], ['19 Oct', 'w,pt,w,,,,']];

// Food. In the live app this is Open Food Facts plus Kyle's recipes.
export type Food = { id: string; n: string; p: string; kcal: number; P: number; C: number; F: number; img?: string };
export const FOODS: Food[] = [
  { id: 'eggs', n: 'Eggs, scrambled', p: '2 large', kcal: 150, P: 13, C: 1, F: 11 },
  { id: 'sourdough', n: 'Sourdough toast', p: '1 slice', kcal: 120, P: 4, C: 23, F: 1 },
  { id: 'avo', n: 'Avocado', p: '½ medium', kcal: 120, P: 1.5, C: 6, F: 11 },
  { id: 'wrap', n: 'High-Protein Breakfast Wrap', p: '1 wrap · KDPT recipe', kcal: 400, P: 41, C: 35, F: 10, img: 'wrap' },
  { id: 'yog', n: 'Greek yoghurt 0%', p: '170 g pot', kcal: 100, P: 17, C: 6, F: 0 },
  { id: 'berries', n: 'Blueberries', p: '80 g', kcal: 45, P: 0.5, C: 11, F: 0.3 },
  { id: 'chicken', n: 'Chicken breast, grilled', p: '150 g', kcal: 165, P: 31, C: 0, F: 3.6 },
  { id: 'rice', n: 'Basmati rice, cooked', p: '150 g', kcal: 195, P: 4, C: 43, F: 0.5 },
  { id: 'whey', n: 'Whey protein shake', p: '30 g scoop', kcal: 120, P: 24, C: 3, F: 1.5 },
  { id: 'oats', n: 'Porridge oats', p: '50 g', kcal: 190, P: 6.5, C: 33, F: 3.5 },
  { id: 'salmon', n: 'Salmon fillet', p: '130 g', kcal: 270, P: 28, C: 0, F: 17 },
  { id: 'pasta', n: 'Creamy Cajun Chicken Pasta', p: '1 portion · KDPT recipe', kcal: 480, P: 45, C: 52, F: 10, img: 'pasta' },
  { id: 'bowl', n: 'Big Mac Loaded Potato Bowl', p: '1 bowl · KDPT recipe', kcal: 540, P: 42, C: 48, F: 18, img: 'potato-bowl' },
  { id: 'turkey', n: 'Turkey & Pasta Tomato Bowl', p: '1 bowl · KDPT recipe', kcal: 500, P: 40, C: 55, F: 11, img: 'turkey-pasta' },
  { id: 'banana', n: 'Banana', p: '1 medium', kcal: 105, P: 1.3, C: 27, F: 0.4 },
  { id: 'almonds', n: 'Almonds', p: '25 g', kcal: 145, P: 5, C: 5, F: 12.5 },
];
export const TARGET = { kcal: 2100, P: 140, C: 210, F: 70 };
export const MACROS = [['P', 'Protein', 'var(--amber)'], ['C', 'Carbs', 'var(--sky)'], ['F', 'Fat', 'var(--violet)']] as const;
export const SLOTS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;
export type Slot = typeof SLOTS[number];

export const MOMENTUM = [
  { k: 'Training', icon: 'train', col: 'var(--mint)', tr: 'rgba(126,213,151,.15)', pct: 2 / 3, val: '2 of 3 workouts', st: ['On track', 'rgba(126,213,151,.14)', 'var(--mint)'] },
  { k: 'Fuel', icon: 'fuel', col: 'var(--amber)', tr: 'rgba(255,180,94,.15)', pct: 5 / 7, val: '5 of 7 protein days', st: ['Nearly', 'rgba(255,180,94,.14)', 'var(--amber)'] },
  { k: 'Recovery', icon: 'clip', col: 'var(--violet)', tr: 'rgba(169,155,255,.15)', pct: 0.8, val: 'Feeling good · 3 wins this week', st: ['Good', 'rgba(169,155,255,.14)', 'var(--violet)'] },
];

// Bookings. Sarah's regular slots: Mondays and Thursdays at 7:00.
export const NOV: [string, number, string][] = [['MON', 2, '7:00'], ['THU', 5, '7:00'], ['MON', 9, '7:00'], ['THU', 12, '7:00'], ['MON', 16, '7:00'], ['THU', 19, '7:00'], ['MON', 23, '7:00'], ['THU', 26, '7:00']];
// Kyle's working hours: the gym opens at 6:30, Wednesday is a half day, no weekends.
export const HOURS: Record<string, [number, number] | null> = { Mon: [6.5, 19.5], Tue: [6.5, 19.5], Wed: [6.5, 13], Thu: [6.5, 19.5], Fri: [6.5, 19.5], Sat: null, Sun: null };
export const hm = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

export const AI: Record<string, { q: string; a: string; src: string; go?: [string, string]; handoff?: boolean }> = {
  swap: { q: 'Can I swap leg press today?', a: 'Yes. Your coach has approved two swaps for Leg Press: Hack Squat (start around 70 kg) or Goblet Squat with a 24 kg dumbbell. Keep the same sets and reps.', src: 'Lower Body A · your coach\'s approved swaps', go: ['Start workout', '/workout'] },
  eat: { q: 'What should I eat before a 7am session?', a: 'Keep it light: a banana and a coffee, or a yoghurt 45 minutes before. Have your 30 g protein breakfast afterwards.', src: 'Your nutrition targets · PT Thursday 7:00', go: ['See this week\'s meals', '/community'] },
  knee: { q: 'My knee aches during lunges', handoff: true, a: 'Pain is something your coach needs to look at, so I\'ve passed this on instead of guessing. Until they reply, skip the lunges and use "I have pain" in your workout if it flares up.', src: 'Pain always goes to your coach' },
};

export const GOALS: [string, string, string, string][] = [['strength', 'trophy', 'var(--mint)', 'Get stronger'], ['fat', 'flame', 'var(--amber)', 'Lose fat'], ['fit', 'bolt', 'var(--sky)', 'Feel fitter'], ['pain', 'body', 'var(--violet)', 'Move pain-free']];
export const FREQ: [string, string, number, string, string][] = [['weekly', 'Weekly', 3, 'High', 'Most accurate Momentum'], ['fortnightly', 'Every 2 weeks', 2, 'Good', 'A good balance'], ['monthly', 'Monthly', 1, 'Basic', 'The lightest touch']];
export const NOTIF_TYPES: [string, string, string, string, string, string][] = [['workout', 'train', 'var(--mint)', 'rgba(126,213,151,.14)', 'Workout reminders', 'On your training days'], ['booking', 'cal', 'var(--sky)', 'rgba(110,198,255,.14)', 'Bookings open', 'On the 20th, for next month'],
  ['session', 'clock', 'var(--sky)', 'rgba(110,198,255,.14)', 'Session reminders', 'The evening before'], ['payment', 'card', 'var(--amber)', 'rgba(255,180,94,.14)', 'Payment reminders', '3 days before it\'s due'],
  ['drop', 'community', 'var(--violet)', 'rgba(169,155,255,.14)', 'Community', 'Wednesday tips, meals and replies to you'], ['checkin', 'clip', 'var(--violet)', 'rgba(169,155,255,.14)', 'Check-in due', 'On your check-in day']];
// Standard pre-exercise health questions (PAR-Q style).
export const PARQ = ['Has a doctor ever said you have a heart condition?', 'Do you get chest pain when you\'re active, or at rest?', 'Do you ever lose balance from dizziness, or pass out?',
  'Do you have a bone, joint or soft-tissue problem that exercise could make worse?', 'Are you taking medication for blood pressure or a heart condition?',
  'Are you pregnant or have you given birth in the last 6 months?', 'Is there any other reason you shouldn\'t exercise?'];
export const CONSENTS: [string, string, string, boolean][] = [['terms', 'Terms and 24-hour cancellation policy', 'Cancel at least 24 hours before a session, or it counts as used.', true],
  ['health', 'Kyle can store my health information', 'Your answers, injuries, pain reports and check-ins. Only Kyle sees them.', true],
  ['photos', 'Progress photos', 'Private to you and Kyle. You can delete them any time.', false],
  ['kai', 'KAI can use my plan to answer questions', 'Your programme and logs, never your photos.', false],
  ['email', 'Tips and news by email', 'About twice a month.', false]];

export type Note = { id: string; icon: string; c: string; bg: string; t: string; b: string; when: string; cta?: [string, string]; unread?: boolean; group: 'Today' | 'Earlier' };
export const NOTES: Note[] = [
  { id: 'pay', icon: 'card', c: 'var(--amber)', bg: 'rgba(255,180,94,.14)', t: 'November payment due Sunday', b: '£260.00 · 8 PT sessions', when: '9:00', cta: ['Pay now', 'sheet:pay'], unread: true, group: 'Today' },
  { id: 'book', icon: 'cal', c: 'var(--sky)', bg: 'rgba(110,198,255,.14)', t: 'Your November sessions are ready to review', b: 'Kyle has proposed 8 sessions on your usual Mon & Thu. Send them back and he\'ll confirm each one.', when: '8:00', cta: ['Review sessions', 'sheet:book'], unread: true, group: 'Today' },
  { id: 'drop', icon: 'community', c: 'var(--violet)', bg: 'rgba(169,155,255,.14)', t: 'Wednesday tip and 3 new meals', b: 'Front-load your protein, plus 3 high-protein recipes.', when: 'Mon', cta: ['Open', '/community'], unread: true, group: 'Earlier' },
  { id: 'sess', icon: 'clock', c: 'var(--sky)', bg: 'rgba(110,198,255,.14)', t: 'PT with Kyle on Thursday', b: '7:00 at the Studio. Free to change until Wednesday 7:00.', when: 'Mon', group: 'Earlier' },
  { id: 'ci', icon: 'clip', c: 'var(--violet)', bg: 'rgba(169,155,255,.14)', t: 'Check-in done', b: 'Momentum updated. Kyle replied to your note.', when: 'Sun', group: 'Earlier' },
];

// Community: Kyle posts; clients like and comment.
export const PEOPLE: Record<string, [string, string, number]> = { kyle: ['Kyle', 'KD', 145], sarah: ['Sarah', 'SM', 145], priya: ['Priya', 'PS', 260], mark: ['Mark', 'MH', 100], tom: ['Tom', 'TR', 30], ellie: ['Ellie', 'EB', 330] };
export const CATS: [string, string, string, string, string][] = [['meals', 'Meals', 'fuel', 'var(--amber)', 'Every recipe Kyle has shared'], ['tips', 'Weekly tips', 'bolt', 'var(--mint)', 'Every Wednesday'],
  ['questions', 'Question of the week', 'chat', 'var(--sky)', 'Every Monday'], ['news', 'Announcements', 'megaphone', 'var(--violet)', 'Studio news and updates'],
  ['other', 'Challenges & more', 'trophy', 'var(--coral)', 'Challenge walls, events, anything else']];
export const COMMUNITY_LIBRARY: Record<string, string[][]> = {
  meals: [['pasta', 'Creamy Cajun Chicken Pasta', 'Week 43'], ['potato-bowl', 'Big Mac Loaded Potato Bowl', 'Week 43'], ['wrap', 'High-Protein Breakfast Wrap', 'Week 43'], ['turkey-pasta', 'Turkey & Pasta Tomato Bowl', 'Week 42'], ['breakfast', 'Eggs, Veg & Sourdough', 'Week 42']],
  tips: [['Week 43', 'Front-load your protein'], ['Week 42', 'Sleep: the free recovery tool'], ['Week 41', 'Warm up properly in 5 minutes'], ['Week 40', 'How to read a food label']],
  questions: [['Week 43', 'What\'s made training easier this month?', '6 replies'], ['Week 42', 'Favourite high-protein snack?', '11 replies'], ['Week 41', 'What are you proudest of this year?', '9 replies']],
  news: [['19 Oct', 'Studio closed Monday 3 November'], ['12 Oct', 'November sessions are scheduled on the 20th'], ['1 Oct', 'Welcome to the new KDPT app']],
  other: [['November', '10k steps a day', '12 joined · live'], ['October', 'Protein target every day', 'Finished · 9 completed it'], ['September', '30-day plank', 'Finished · 14 completed it']],
};
export type Post = { id: string; by: string; when: string; cat?: string; pinned?: boolean; title?: string; body: string; imgs?: string[]; board?: [string, string][]; likes: number; cmts: [string, string][] };
export const POSTS: Post[] = [
  { id: 'q1', by: 'kyle', when: 'Mon', cat: 'questions', pinned: true, title: 'Question of the week', body: 'What\'s one thing that has made training easier for you this month?', likes: 8,
    cmts: [['priya', 'Laying my gym kit out the night before!'], ['mark', 'Training with Jen. No skipping when someone\'s waiting for you 😂'], ['ellie', 'Shorter 30 minute sessions on busy days']] },
  { id: 'p1', by: 'kyle', when: '2 h', title: 'Shout-out to Priya 🎉', body: '10k this morning in 52:40, a new PB and 3 minutes faster than June. The strength work is paying off.', likes: 21, cmts: [['priya', 'Thank you! Legs held up so much better this time'], ['sarah', 'Amazing, well done!']] },
  { id: 't1', by: 'kyle', when: 'Wed', cat: 'tips', title: 'Front-load your protein', body: 'Aim for 30g at breakfast. It keeps you full until lunch and makes your daily target far easier to hit.', likes: 14, cmts: [] },
  { id: 'm1', by: 'kyle', when: 'Wed', cat: 'meals', title: 'This week\'s 3 high-protein meals', body: 'All under 550 kcal with 40g+ protein. Tap one in the Library to add it to Fuel.', imgs: ['pasta', 'potato-bowl', 'wrap'], likes: 17, cmts: [['tom', 'Made the Big Mac bowl twice already']] },
  { id: 'c1', by: 'kyle', when: 'Sun', cat: 'other', title: 'November challenge: 10k steps a day', body: 'Leaderboard updates every evening from your phone\'s step count.', board: [['Mark', '14,210'], ['Sarah', '12,880'], ['Tom', '11,040']], likes: 12, cmts: [] },
];

// Check-in: four short steps. How you feel comes first; the scale is optional.
export const MOODS: [string, string][] = [['Rough', 'var(--coral)'], ['Low', 'var(--amber)'], ['Okay', '#c9cfcb'], ['Good', 'var(--sky)'], ['Great', 'var(--mint)']];
export const WEEK_SCALES: [string, string, string, string, string, string][] = [['sleep', 'Sleep', 'moon', 'var(--violet)', 'Poor', 'Great'], ['energy', 'Energy', 'bolt', 'var(--mint)', 'Flat', 'Buzzing'],
  ['stress', 'Stress', 'flame', 'var(--coral)', 'Calm', 'Maxed out'], ['food', 'Food', 'fuel', 'var(--amber)', 'Off track', 'Spot on'],
  ['motivation', 'Motivation', 'trophy', 'var(--sky)', 'Low', 'Fired up']];
export const WINS: [string, string, string, string][] = [['clothes', 'Clothes fit better', 'shirt', 'var(--mint)'], ['energy', 'More energy', 'bolt', 'var(--amber)'], ['sleep', 'Sleeping better', 'moon', 'var(--violet)'],
  ['strength', 'Lifting heavier', 'train', 'var(--mint)'], ['confident', 'Feeling confident', 'heart', 'var(--coral)'], ['bloat', 'Less bloated', 'drop', 'var(--sky)'],
  ['mood', 'Better mood', 'sun', 'var(--amber)'], ['plan', 'Stuck to my plan', 'clip', 'var(--violet)']];
export const SUPPORT: [string, string, string, string][] = [['same', 'Keep things as they are', 'check', 'var(--mint)'], ['accountability', 'More accountability', 'bell', 'var(--amber)'],
  ['food', 'Help with food', 'fuel', 'var(--amber)'], ['training', 'Change my training', 'train', 'var(--mint)'],
  ['call', 'A call with my coach', 'chat', 'var(--sky)'], ['pep', 'Just a bit of encouragement', 'heart', 'var(--coral)']];
