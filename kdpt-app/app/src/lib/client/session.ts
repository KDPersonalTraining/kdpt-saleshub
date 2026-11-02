// Small rules for the workout in progress.

// Time spent training: from the start, minus any time paused.
export function elapsedMs(s: { startedAt: number | null; pausedMs: number; pausedAt: number | null }, now: number): number {
  if (s.startedAt == null) return 0;
  const pausedNow = s.pausedAt != null ? now - s.pausedAt : 0;
  return Math.max(0, now - s.startedAt - s.pausedMs - pausedNow);
}

export const clock = (ms: number) => {
  const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

// The − and + buttons. Weight moves by the exercise's load jump (or 2.5 kg),
// never below 0 or above 500; reps by 1, from 1 to 100.
export function stepLoad(value: string, by: number): string {
  const n = Number(String(value).replace(',', '.'));
  const next = Math.min(500, Math.max(0, (isFinite(n) ? n : 0) + by));
  return String(Math.round(next * 100) / 100);
}
export function stepReps(value: string, by: number): string {
  const n = parseInt(value, 10);
  return String(Math.min(100, Math.max(1, (isFinite(n) ? n : 0) + by)));
}

// The set to log next: the first one not done, or null when all are done.
export const nextSetIndex = (sets: { done: boolean }[]) => { const i = sets.findIndex(x => !x.done); return i < 0 ? null : i; };
