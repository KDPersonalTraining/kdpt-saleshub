// Estimated one-rep max (Epley). Only trustworthy up to about 12 reps, so
// higher-rep sets return null rather than a misleading number.
export const MAX_REPS_FOR_ESTIMATE = 12;

export function estimateOneRepMax(load: number, reps: number): number | null {
  if (!(load > 0) || !Number.isInteger(reps) || reps < 1) return null;
  if (reps === 1) return load;
  if (reps > MAX_REPS_FOR_ESTIMATE) return null;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}

// The set with the highest estimate, e.g. for "your best" on an exercise.
export function bestSet<T extends { load: number; reps: number }>(sets: T[]): T | null {
  let best: T | null = null, top = -1;
  for (const s of sets) {
    const e = estimateOneRepMax(s.load, s.reps);
    if (e !== null && e > top) { top = e; best = s; }
  }
  return best;
}
