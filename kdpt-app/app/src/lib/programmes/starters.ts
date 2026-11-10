// Kyle's starter programmes and the exercises they use. Giving one to a
// client copies it into the database as that client's own programme, so
// changing a starter here never changes a plan someone is already on.

export type Pattern = 'squat' | 'hinge' | 'lunge' | 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull'
  | 'carry' | 'core_anti_extension' | 'core_anti_rotation' | 'core_flexion' | 'isolation_upper' | 'isolation_lower' | 'conditioning';
export type LoadType = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine_stack' | 'machine_plate' | 'cable' | 'bodyweight' | 'other';

export type StarterExercise = {
  slug: string; name: string; pattern: Pattern; load: LoadType; muscles: string[];
  // Smallest sensible weight jump in kg. 0 = bodyweight (no weight to log).
  inc: number; setup: number; cues: string[];
  // Cardio is logged as distance and time; its reps are the target minutes.
  measure?: 'distance';
};

const x = (slug: string, name: string, pattern: Pattern, load: LoadType, muscles: string, inc: number, cues: string[], setup = 1): StarterExercise =>
  ({ slug, name, pattern, load, muscles: muscles.split(', '), inc, setup, cues });

export const EXERCISES: StarterExercise[] = [
  // Squat and lunge
  x('leg-press', 'Leg Press', 'squat', 'machine_plate', 'Quads, glutes', 10, ['Feet shoulder-width, mid-platform', 'Lower until your knees reach about 90°', 'Push through the whole foot, don’t lock out'], 1.5),
  x('goblet-box-squat', 'Goblet Box Squat', 'squat', 'dumbbell', 'Quads, glutes', 2, ['Hold the dumbbell at your chest', 'Sit back until you touch the box', 'Stand up without rocking'], 1),
  x('goblet-squat', 'Goblet Squat', 'squat', 'dumbbell', 'Quads, glutes, core', 2, ['Hold the dumbbell at your chest', 'Sit between your heels, chest tall', 'Drive up through mid-foot'], 1),
  x('back-squat', 'Barbell Back Squat', 'squat', 'barbell', 'Quads, glutes', 2.5, ['Bar on your upper back, hands just outside shoulders', 'Brace, then sit down between your heels', 'Knees follow your toes; stand up tall'], 2.5),
  x('hack-squat', 'Hack Squat', 'squat', 'machine_plate', 'Quads', 10, ['Back flat on the pad', 'Lower for 2 seconds', 'Stop just short of lockout'], 1.5),
  x('leg-extension', 'Leg Extension', 'isolation_lower', 'machine_stack', 'Quads', 5, ['Knee in line with the pivot', 'Squeeze at the top for a second', 'Lower slowly'], 0.5),
  x('step-up', 'Dumbbell Step-up', 'lunge', 'dumbbell', 'Quads, glutes', 2, ['Whole foot on the box', 'Push through the top leg, not the back one', 'Step down slowly'], 1),
  x('split-squat', 'Split Squat', 'lunge', 'dumbbell', 'Quads, glutes', 2, ['Feet hip-width apart, one forward', 'Drop straight down', 'Most weight through the front foot'], 1),
  x('reverse-lunge', 'Reverse Lunge', 'lunge', 'dumbbell', 'Quads, glutes', 2, ['Step back, back knee towards the floor', 'Front knee stays over the foot', 'Push through the front heel to stand'], 1),
  x('walking-lunge', 'Walking Lunge', 'lunge', 'dumbbell', 'Quads, glutes', 2, ['Long step, back knee towards the floor', 'Front knee follows your toes', 'Push through the front heel'], 1),
  // Hinge
  x('glute-bridge', 'Glute Bridge', 'hinge', 'bodyweight', 'Glutes, hamstrings', 0, ['Feet flat, knees bent', 'Squeeze your glutes to lift your hips', 'Pause at the top, ribs down'], 0.5),
  x('db-rdl', 'Dumbbell Romanian Deadlift', 'hinge', 'dumbbell', 'Hamstrings, glutes', 2, ['Soft knees, push your hips back', 'Dumbbells close to your legs', 'Stop when your hamstrings are tight'], 1),
  x('rdl', 'Romanian Deadlift', 'hinge', 'barbell', 'Hamstrings, glutes', 2.5, ['Soft knees, push your hips back', 'Bar stays close to your legs', 'Stop when your hamstrings are tight, not your back'], 1.5),
  x('trap-bar-deadlift', 'Trap Bar Deadlift', 'hinge', 'barbell', 'Glutes, quads, back', 5, ['Stand in the middle, handles in line with your ankles', 'Brace, push the floor away', 'Stand tall, then lower with control'], 2),
  x('hip-thrust', 'Hip Thrust', 'hinge', 'barbell', 'Glutes', 5, ['Upper back on the bench edge', 'Chin tucked, ribs down', 'Squeeze at the top for a second'], 2),
  x('leg-curl', 'Seated Leg Curl', 'isolation_lower', 'machine_stack', 'Hamstrings', 5, ['Knees in line with the pivot', 'Curl all the way, squeeze for a second', 'Lower slowly for 2 seconds'], 0.5),
  x('calf-raise', 'Calf Raise', 'isolation_lower', 'machine_stack', 'Calves', 5, ['Balls of the feet on the edge', 'Full stretch at the bottom', 'Pause at the top'], 0.5),
  // Push
  x('chest-press', 'Machine Chest Press', 'horizontal_push', 'machine_stack', 'Chest, triceps', 5, ['Handles level with mid-chest', 'Press without locking out', 'Let your chest stretch on the way back'], 0.5),
  x('incline-push-up', 'Incline Push-up', 'horizontal_push', 'bodyweight', 'Chest, triceps', 0, ['Hands on a bench, body in one line', 'Lower your chest to the bench', 'Push the floor away'], 0.5),
  x('push-up', 'Push-up', 'horizontal_push', 'bodyweight', 'Chest, triceps, core', 0, ['Hands under shoulders, body in one line', 'Chest to just above the floor', 'Elbows at about 45°'], 0.5),
  x('db-bench', 'Dumbbell Bench Press', 'horizontal_push', 'dumbbell', 'Chest, triceps', 2, ['Feet flat, shoulder blades back', 'Lower to the sides of your chest', 'Press up and slightly in'], 1),
  x('incline-db-press', 'Incline Dumbbell Press', 'horizontal_push', 'dumbbell', 'Upper chest, shoulders', 2, ['Bench at about 30°', 'Lower to your upper chest', 'Press up over your shoulders'], 1),
  x('bench-press', 'Barbell Bench Press', 'horizontal_push', 'barbell', 'Chest, triceps', 2.5, ['Eyes under the bar, feet planted', 'Lower to your lower chest', 'Press back up over your shoulders'], 2),
  x('db-shoulder-press', 'Seated Dumbbell Shoulder Press', 'vertical_push', 'dumbbell', 'Shoulders, triceps', 2, ['Sit tall, back against the pad', 'Press up and slightly in', 'Lower to ear height'], 1),
  x('ohp', 'Standing Overhead Press', 'vertical_push', 'barbell', 'Shoulders, triceps, core', 2.5, ['Squeeze glutes, ribs down', 'Press the bar past your face', 'Finish with the bar over your mid-foot'], 1.5),
  x('lateral-raise', 'Lateral Raise', 'isolation_upper', 'dumbbell', 'Side shoulders', 1, ['Slight bend in the elbows', 'Lift out to the side to shoulder height', 'Lower for 2 seconds'], 0.5),
  x('triceps-pushdown', 'Triceps Pushdown', 'isolation_upper', 'cable', 'Triceps', 2.5, ['Elbows pinned to your sides', 'Push down until your arms are straight', 'Control it back up'], 0.5),
  // Pull
  x('lat-pulldown', 'Lat Pulldown', 'vertical_pull', 'machine_stack', 'Back, biceps', 2.5, ['Grip just outside shoulder-width', 'Pull your elbows down to your ribs', 'Control it back up'], 0.5),
  x('assisted-pull-up', 'Assisted Pull-up', 'vertical_pull', 'machine_stack', 'Back, biceps', 5, ['Grip just outside shoulder-width', 'Pull your chest towards the bar', 'Lower all the way down'], 1),
  x('seated-row', 'Seated Cable Row', 'horizontal_pull', 'cable', 'Mid back', 2.5, ['Chest up, shoulders down', 'Pull to your belly button', 'Pause, then let your shoulders reach forward'], 0.5),
  x('db-row', 'Single-arm Dumbbell Row', 'horizontal_pull', 'dumbbell', 'Back, biceps', 2, ['Hand and knee on the bench, back flat', 'Pull the dumbbell to your hip', 'Lower until your arm is straight'], 1),
  x('chest-supported-row', 'Chest-supported Row', 'horizontal_pull', 'dumbbell', 'Mid back', 2, ['Chest on an incline bench', 'Pull your elbows back past your body', 'Squeeze your shoulder blades together'], 1),
  x('face-pull', 'Face Pull', 'horizontal_pull', 'cable', 'Rear shoulders, upper back', 2.5, ['Rope at face height', 'Pull towards your eyes, elbows high', 'Squeeze, then return slowly'], 0.5),
  x('db-curl', 'Dumbbell Curl', 'isolation_upper', 'dumbbell', 'Biceps', 1, ['Elbows by your sides', 'Curl without swinging', 'Lower for 2 seconds'], 0.5),
  x('hammer-curl', 'Hammer Curl', 'isolation_upper', 'dumbbell', 'Biceps, forearms', 1, ['Palms facing each other', 'Elbows still', 'Lower slowly'], 0.5),
  // Core and carries
  x('dead-bug', 'Dead Bug', 'core_anti_extension', 'bodyweight', 'Deep core', 0, ['Lower back pressed into the floor', 'Opposite arm and leg go out together', 'Breathe out as you reach'], 0.5),
  x('plank', 'Plank', 'core_anti_extension', 'bodyweight', 'Core, shoulders', 0, ['Elbows under shoulders', 'Squeeze glutes, ribs down', 'Stop when your hips drop'], 0.5),
  x('side-plank', 'Side Plank', 'core_anti_rotation', 'bodyweight', 'Obliques', 0, ['Elbow under your shoulder', 'Hips high, body in one line', 'Breathe steadily'], 0.5),
  x('pallof-press', 'Pallof Press', 'core_anti_rotation', 'cable', 'Core', 2.5, ['Stand side-on to the cable', 'Press straight out from your chest', 'Don’t let it pull you round'], 0.5),
  // Cardio: logged as distance and time
  { ...x('treadmill-walk', 'Incline Treadmill Walk', 'conditioning', 'other', 'Heart and lungs, legs', 0, ['Incline 6–12%, a pace you could chat at', 'Don’t hold the handrails', 'Log the distance from the screen'], 1), measure: 'distance' },
  { ...x('treadmill-run', 'Treadmill Run', 'conditioning', 'other', 'Heart and lungs, legs', 0, ['Start easy for 2 minutes', 'Short, light steps', 'Log the distance from the screen'], 1), measure: 'distance' },
  { ...x('outdoor-run', 'Outdoor Run or Walk', 'conditioning', 'other', 'Heart and lungs, legs', 0, ['Use your phone or watch for the distance', 'Easy enough to talk in short sentences', 'Walk breaks are fine'], 0.5), measure: 'distance' },
  { ...x('rower', 'Rowing Machine', 'conditioning', 'other', 'Heart and lungs, back, legs', 0, ['Legs, then body, then arms', 'Damper around 4–5', 'Log the metres from the screen'], 1), measure: 'distance' },
  { ...x('bike', 'Exercise Bike', 'conditioning', 'other', 'Heart and lungs, legs', 0, ['Seat at hip height', 'Steady cadence', 'Log the distance from the screen'], 1), measure: 'distance' },
  { ...x('skierg', 'SkiErg', 'conditioning', 'other', 'Heart and lungs, back, arms', 0, ['Hinge and pull down together', 'Arms finish by your thighs', 'Log the metres from the screen'], 1), measure: 'distance' },
  x('farmers-carry', 'Farmer’s Carry', 'carry', 'dumbbell', 'Grip, core, upper back', 2, ['Heavy dumbbells by your sides', 'Walk tall, short quick steps', 'Don’t let them swing'], 1),
];
export const exerciseBySlug = (slug: string) => EXERCISES.find(e => e.slug === slug);

export type Priority = 'must_keep' | 'keep_if_time' | 'first_to_cut';
export type StarterItem = { slug: string; sets: number; reps: [number, number]; rest: number; priority: Priority; note?: string; plan?: import('./sets').PlannedSet[] };
export type StarterWorkout = { name: string; focus: string; weeks?: [number, number]; phase?: string; items: StarterItem[] };
export type Starter = { key: string; name: string; summary: string; level: 'Beginner' | 'Intermediate'; weeks: number; daysPerWeek: string; workouts: StarterWorkout[] };

// [slug, sets, reps min, reps max, rest seconds, priority, note]
type Row = [string, number, number, number, number, Priority?, string?];
const items = (rows: Row[]): StarterItem[] => rows.map(([slug, sets, lo, hi, rest, priority = 'keep_if_time', note]) => ({ slug, sets, reps: [lo, hi], rest, priority, ...(note ? { note } : {}) }));
const M = 'must_keep', K = 'keep_if_time', C = 'first_to_cut';

export const STARTERS: Starter[] = [
  {
    key: 'beginner-foundations', name: 'Beginner Foundations', level: 'Beginner', weeks: 12, daysPerWeek: '2–3 days',
    summary: 'Two full-body workouts, alternated. Starts on machines and simple moves, then brings in free weights, single-leg work and barbell lifts every three weeks.',
    workouts: [
      { name: 'Full Body A', focus: 'Full body', weeks: [1, 3], phase: 'Learn the basics', items: items([
        ['leg-press', 2, 10, 12, 90, M, 'Find a weight that feels steady. Smooth reps.'], ['chest-press', 2, 10, 12, 90, M], ['lat-pulldown', 2, 10, 12, 90, M],
        ['glute-bridge', 2, 12, 15, 60, K], ['dead-bug', 2, 8, 10, 45, C]]) },
      { name: 'Full Body B', focus: 'Full body', weeks: [1, 3], phase: 'Learn the basics', items: items([
        ['goblet-box-squat', 2, 8, 10, 90, M, 'Light dumbbell. Learn to sit back to the box.'], ['seated-row', 2, 10, 12, 90, M], ['db-shoulder-press', 2, 10, 12, 90, K],
        ['leg-curl', 2, 10, 12, 60, K], ['plank', 2, 1, 1, 45, C, 'Hold 20–30 seconds. Log 1 rep per hold.']]) },
      { name: 'Full Body A', focus: 'Full body', weeks: [4, 6], phase: 'Add free weights', items: items([
        ['goblet-squat', 3, 8, 10, 90, M, 'New: no box now. Same depth.'], ['db-bench', 3, 8, 10, 90, M, 'New: dumbbells instead of the machine.'], ['lat-pulldown', 3, 10, 12, 90, M],
        ['db-rdl', 3, 10, 12, 90, K, 'New: learn the hip hinge. Light to start.'], ['dead-bug', 2, 10, 12, 45, C]]) },
      { name: 'Full Body B', focus: 'Full body', weeks: [4, 6], phase: 'Add free weights', items: items([
        ['leg-press', 3, 10, 12, 90, M], ['seated-row', 3, 10, 12, 90, M], ['incline-push-up', 3, 8, 12, 60, K, 'New'],
        ['step-up', 2, 8, 10, 60, K, 'New: each leg. Low box to start.'], ['plank', 2, 1, 1, 45, C, 'Hold 30–40 seconds.']]) },
      { name: 'Full Body A', focus: 'Full body', weeks: [7, 9], phase: 'Build on it', items: items([
        ['goblet-squat', 3, 8, 10, 120, M], ['db-bench', 3, 8, 10, 90, M], ['db-row', 3, 8, 10, 90, M, 'New: each arm.'],
        ['db-rdl', 3, 8, 10, 90, K], ['split-squat', 2, 8, 10, 60, K, 'New: each leg.'], ['pallof-press', 2, 10, 12, 45, C, 'New: each side.']]) },
      { name: 'Full Body B', focus: 'Full body', weeks: [7, 9], phase: 'Build on it', items: items([
        ['leg-press', 3, 8, 10, 120, M], ['lat-pulldown', 3, 8, 10, 90, M], ['db-shoulder-press', 3, 8, 10, 90, K],
        ['hip-thrust', 3, 10, 12, 90, K, 'New: start with the bar only, or a dumbbell.'], ['reverse-lunge', 2, 8, 10, 60, K, 'New: each leg.'], ['side-plank', 2, 1, 1, 45, C, 'New: hold 20–30 seconds each side.']]) },
      { name: 'Full Body A', focus: 'Full body', weeks: [10, 12], phase: 'Barbell skills', items: items([
        ['back-squat', 3, 6, 8, 150, M, 'New: Kyle will coach this first. Start with the bar.'], ['db-bench', 3, 8, 10, 90, M], ['chest-supported-row', 3, 8, 10, 90, M],
        ['rdl', 3, 8, 10, 120, K, 'New: barbell version.'], ['walking-lunge', 2, 10, 10, 60, K, 'Steps in total.'], ['pallof-press', 2, 10, 12, 45, C]]) },
      { name: 'Full Body B', focus: 'Full body', weeks: [10, 12], phase: 'Barbell skills', items: items([
        ['trap-bar-deadlift', 3, 6, 8, 150, M, 'New: Kyle will coach this first.'], ['lat-pulldown', 3, 8, 10, 90, M], ['ohp', 3, 6, 8, 120, K, 'New: start with the bar.'],
        ['hip-thrust', 3, 8, 10, 90, K], ['split-squat', 2, 8, 10, 60, K], ['farmers-carry', 3, 1, 1, 60, C, 'New: walk 30 metres. Log 1 rep per carry.']]) },
    ],
  },
  {
    key: 'cardio-conditioning', name: 'Cardio & Conditioning', level: 'Beginner', weeks: 6, daysPerWeek: '3 days',
    summary: 'Steady cardio, intervals and a full-body circuit. Cardio is logged as distance and time, so every session shows how far they went.',
    workouts: [
      { name: 'Steady Cardio', focus: 'Easy, chatty pace', items: items([
        ['treadmill-walk', 1, 20, 30, 60, M, 'Minutes. A pace you could hold a conversation at.'], ['bike', 1, 10, 15, 60, K, 'Minutes.'], ['plank', 2, 1, 1, 45, C, 'Hold 30 seconds.']]) },
      { name: 'Intervals', focus: 'Harder efforts with rests', items: items([
        ['rower', 4, 3, 4, 120, M, 'Minutes per piece. Hard but steady; log each one.'], ['bike', 4, 1, 2, 90, K, 'Minutes per effort. Fast legs.'], ['dead-bug', 2, 10, 12, 45, C]]) },
      { name: 'Strength Circuit', focus: 'Full body', items: items([
        ['goblet-squat', 3, 10, 12, 60, M], ['push-up', 3, 8, 12, 60, M], ['seated-row', 3, 10, 12, 60, K],
        ['db-rdl', 3, 10, 12, 60, K], ['skierg', 2, 3, 5, 90, C, 'Minutes. Finish strong.']]) },
    ],
  },
  {
    key: 'upper-lower', name: 'Upper / Lower', level: 'Intermediate', weeks: 8, daysPerWeek: '4 days',
    summary: 'Upper body and lower body on separate days, each twice a week. A heavier day and a lighter day for each.',
    workouts: [
      { name: 'Upper A', focus: 'Upper body · heavier', items: items([
        ['bench-press', 3, 6, 8, 150, M], ['db-row', 3, 8, 10, 90, M], ['db-shoulder-press', 3, 8, 10, 90, K],
        ['lat-pulldown', 3, 10, 12, 90, K], ['triceps-pushdown', 2, 10, 12, 60, C], ['db-curl', 2, 10, 12, 60, C]]) },
      { name: 'Lower A', focus: 'Lower body · squat', items: items([
        ['back-squat', 3, 6, 8, 180, M], ['rdl', 3, 8, 10, 120, M], ['split-squat', 3, 8, 10, 90, K],
        ['leg-curl', 3, 10, 12, 60, K], ['calf-raise', 3, 12, 15, 60, C], ['plank', 2, 1, 1, 45, C, 'Hold 40 seconds.']]) },
      { name: 'Upper B', focus: 'Upper body · lighter', items: items([
        ['incline-db-press', 3, 8, 10, 90, M], ['assisted-pull-up', 3, 6, 10, 120, M], ['chest-supported-row', 3, 10, 12, 90, K],
        ['lateral-raise', 3, 12, 15, 60, K], ['face-pull', 2, 12, 15, 60, C], ['hammer-curl', 2, 10, 12, 60, C]]) },
      { name: 'Lower B', focus: 'Lower body · hinge', items: items([
        ['trap-bar-deadlift', 3, 5, 6, 180, M], ['leg-press', 3, 10, 12, 120, M], ['hip-thrust', 3, 8, 10, 90, K],
        ['leg-extension', 2, 12, 15, 60, K], ['walking-lunge', 2, 10, 10, 60, C, 'Steps in total.'], ['dead-bug', 2, 10, 12, 45, C]]) },
    ],
  },
  {
    key: 'push-pull-legs', name: 'Push / Pull / Legs', level: 'Intermediate', weeks: 8, daysPerWeek: '3 or 6 days',
    summary: 'Pushing muscles, pulling muscles and legs on separate days. Run it once a week (3 days) or twice (6 days).',
    workouts: [
      { name: 'Push', focus: 'Chest, shoulders, triceps', items: items([
        ['bench-press', 4, 6, 8, 150, M], ['incline-db-press', 3, 8, 10, 90, M], ['db-shoulder-press', 3, 8, 10, 90, K],
        ['lateral-raise', 3, 12, 15, 60, K], ['triceps-pushdown', 3, 10, 12, 60, C], ['push-up', 2, 8, 15, 60, C, 'As many good reps as you can.']]) },
      { name: 'Pull', focus: 'Back, biceps', items: items([
        ['lat-pulldown', 4, 8, 10, 120, M], ['seated-row', 3, 8, 10, 90, M], ['db-row', 3, 8, 10, 90, K],
        ['face-pull', 3, 12, 15, 60, K], ['db-curl', 3, 10, 12, 60, C], ['hammer-curl', 2, 10, 12, 60, C]]) },
      { name: 'Legs', focus: 'Quads, glutes, hamstrings', items: items([
        ['back-squat', 4, 6, 8, 180, M], ['rdl', 3, 8, 10, 120, M], ['leg-press', 3, 10, 12, 120, K],
        ['leg-curl', 3, 10, 12, 60, K], ['calf-raise', 3, 12, 15, 60, C], ['pallof-press', 2, 10, 12, 45, C]]) },
    ],
  },
];
// A few set-by-set plans on the main lifts: a warm-up before heavy work,
// a pyramid, and a drop set to finish.
const W = (reps: number, ...work: [number, number][]) => [{ kind: 'warmup' as const, reps: [reps, reps] as [number, number] }, ...work.map(r => ({ kind: 'working' as const, reps: r }))];
const PLANS: Record<string, Record<string, import('./sets').PlannedSet[]>> = {
  'upper-lower': { 'bench-press': W(10, [6, 8], [6, 8], [6, 8]), 'back-squat': W(8, [6, 8], [6, 8], [6, 8]), 'trap-bar-deadlift': W(6, [5, 6], [5, 6], [5, 6]) },
  'push-pull-legs': {
    'bench-press': [{ kind: 'warmup', reps: [10, 10] }, { kind: 'working', reps: [10, 12] }, { kind: 'working', reps: [8, 10] }, { kind: 'working', reps: [6, 8] }],
    'lat-pulldown': [{ kind: 'working', reps: [8, 10] }, { kind: 'working', reps: [8, 10] }, { kind: 'working', reps: [8, 10] }, { kind: 'drop', reps: [10, 15] }],
    'back-squat': W(8, [6, 8], [6, 8], [6, 8], [6, 8]),
    'triceps-pushdown': [{ kind: 'working', reps: [10, 12] }, { kind: 'working', reps: [10, 12] }, { kind: 'amrap', reps: [12, 30] }],
  },
};
for (const s of STARTERS) for (const w of s.workouts) for (const it of w.items) { const p = PLANS[s.key]?.[it.slug]; if (p) { it.plan = p; it.sets = p.length; } }

export const starterByKey = (key: string) => STARTERS.find(s => s.key === key);

// The phases of a starter, in order: [label, first week, last week].
export function phasesOf(s: Starter): [string, number, number][] {
  const seen = new Map<string, [string, number, number]>();
  for (const w of s.workouts) {
    const [a, b] = w.weeks ?? [1, s.weeks];
    const k = `${a}-${b}`;
    if (!seen.has(k)) seen.set(k, [w.phase ?? 'Every week', a, b]);
  }
  return [...seen.values()].sort((p, q) => p[1] - q[1]);
}
