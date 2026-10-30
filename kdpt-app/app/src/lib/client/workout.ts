import { fitToTime, suggestLoad } from '@/lib/rules';
import { WORKOUT, type Exercise } from './sample-data';

// Today's workout, cut to fit the time the client has.
export function planFor(minutes: number) {
  const fitted = fitToTime(WORKOUT.exercises.map(e => ({ id: e.id, sets: e.sets, restSeconds: e.rest, setupMinutes: e.setup, priority: e.priority })), minutes);
  return { minutes: fitted.minutes, items: fitted.items.map(it => ({ ex: WORKOUT.exercises.find(e => e.id === it.exercise.id)!, sets: it.sets })) };
}

export const suggestionFor = (ex: Exercise) => suggestLoad({ sets: ex.sets, repRange: ex.reps, increment: ex.inc }, ex.last);
export const repRange = (ex: Exercise) => (ex.reps[0] === ex.reps[1] ? `${ex.reps[0]}` : `${ex.reps[0]}–${ex.reps[1]}`);
