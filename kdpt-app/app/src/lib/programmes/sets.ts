// Set-by-set plans: warm-ups, a different rep range per set, drop sets and
// as-many-as-possible sets. An exercise without a plan has identical sets.
export type SetKind = 'warmup' | 'working' | 'drop' | 'amrap';
export type PlannedSet = { kind: SetKind; reps: [number, number] };
export const KIND_LABEL: Record<SetKind, string> = { warmup: 'Warm-up', working: 'Working set', drop: 'Drop set', amrap: 'As many as you can' };
export const KIND_SHORT: Record<SetKind, string> = { warmup: 'W', working: '', drop: 'D', amrap: 'Max' };

// The plan for each set, from a stored plan or the plain "3 sets of 8-10".
export const setsOf = (sets: number, reps: [number, number], plan?: PlannedSet[] | null): PlannedSet[] =>
  plan?.length ? plan : Array.from({ length: sets }, () => ({ kind: 'working' as const, reps }));

// A sensible starting weight for a set, from the working weight: warm-ups at
// about half, drop sets about 20% lighter, rounded to the exercise's weight jump.
export function setLoad(kind: SetKind, working: number | null, inc: number): number | null {
  if (working == null || !(working > 0)) return null;
  const step = inc > 0 ? inc : 2.5;
  const f = kind === 'warmup' ? 0.5 : kind === 'drop' ? 0.8 : 1;
  return Math.max(0, Math.round((working * f) / step) * step);
}

// Where to start the − / + buttons when the box is empty: an empty barbell,
// light dumbbells, or the lightest stack on a machine.
export const firstStep = (kit: string, inc: number) => (kit === 'barbell' ? 20 : kit === 'dumbbell' ? 6 : kit === 'body' ? 0 : Math.max(inc, 10));

export function cleanPlan(input: unknown, cap: number): PlannedSet[] | null | string {
  if (input == null) return null;
  if (!Array.isArray(input) || !input.length) return null;
  if (input.length > 10) return 'At most 10 sets.';
  const out: PlannedSet[] = [];
  for (const r of input as PlannedSet[]) {
    if (!['warmup', 'working', 'drop', 'amrap'].includes(r?.kind)) return 'Choose a type for every set.';
    const lo = Number(r.reps?.[0]), hi = Number(r.reps?.[1]);
    if (!(Number.isInteger(lo) && Number.isInteger(hi) && lo >= 1 && hi >= lo && hi <= cap)) return `Each set’s reps must be 1 to ${cap}, lowest first.`;
    out.push({ kind: r.kind, reps: [lo, hi] });
  }
  if (!out.some(s => s.kind !== 'warmup')) return 'Add at least one set that isn’t a warm-up.';
  return out;
}
