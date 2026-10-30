// Fits a workout into the time a client has. Cuts in a fixed order so the
// coach's priorities are respected:
//   1. drop "first_to_cut" exercises (from the end)
//   2. trim "keep_if_time" exercises to 2 sets
//   3. drop "keep_if_time" exercises (from the end)
//   4. trim "must_keep" exercises to 2 sets
// "must_keep" exercises are never removed.

export type Priority = 'must_keep' | 'keep_if_time' | 'first_to_cut';
export type PlannedExercise = { id: string; sets: number; restSeconds: number; setupMinutes: number; priority: Priority };
export type PlanItem = { exercise: PlannedExercise; sets: number };
export type FittedPlan = { items: PlanItem[]; minutes: number; fits: boolean; removed: string[]; trimmed: string[] };

export const WARMUP_MINUTES = 8;
const WORK_SECONDS_PER_SET = 50;
const MIN_SETS = 2;

export function exerciseMinutes(ex: PlannedExercise, sets: number): number {
  return ex.setupMinutes + (sets * WORK_SECONDS_PER_SET + (sets - 1) * ex.restSeconds) / 60 + 1;
}

export function planMinutes(items: PlanItem[]): number {
  return items.reduce((m, it) => m + exerciseMinutes(it.exercise, it.sets), 0) + WARMUP_MINUTES;
}

export function fitToTime(exercises: PlannedExercise[], minutes: number): FittedPlan {
  let items: PlanItem[] = exercises.map(exercise => ({ exercise, sets: exercise.sets }));
  const removed: string[] = [], trimmed: string[] = [];
  const over = () => planMinutes(items) > minutes;

  const dropLast = (p: Priority) => {
    const target = [...items].reverse().find(it => it.exercise.priority === p);
    if (!target) return false;
    items = items.filter(it => it !== target);
    removed.push(target.exercise.id);
    return true;
  };
  const trimFirst = (p: Priority) => {
    const target = items.find(it => it.exercise.priority === p && it.sets > MIN_SETS);
    if (!target) return false;
    target.sets = MIN_SETS;
    trimmed.push(target.exercise.id);
    return true;
  };

  const steps = [() => dropLast('first_to_cut'), () => trimFirst('keep_if_time'), () => dropLast('keep_if_time'), () => trimFirst('must_keep')];
  for (const step of steps) while (over() && step()) { /* keep cutting */ }

  const total = planMinutes(items);
  return { items, minutes: Math.round(total), fits: total <= minutes, removed, trimmed };
}
