// Double progression: keep the load until every working set reaches the top
// of the rep range, then add the exercise's load jump.

export type LastResult = { load: number; reps: number[] };
export type Prescription = { sets: number; repRange: [number, number]; increment: number };
export type Suggestion = { load: number; increased: boolean; reason: string };

export function suggestLoad(rx: Prescription, last: LastResult | null): Suggestion {
  const [, top] = rx.repRange;
  if (!last) return { load: 0, increased: false, reason: 'First time: pick a weight you could lift for a couple more reps.' };
  if (rx.increment <= 0) return { load: last.load, increased: false, reason: 'Bodyweight. Slow and controlled.' };

  const hitAll = last.reps.length >= rx.sets && last.reps.slice(0, rx.sets).every(r => r >= top);
  if (hitAll) {
    return {
      load: round(last.load + rx.increment),
      increased: true,
      reason: `You hit ${top} reps on every set at ${last.load}kg last time, so the weight goes up.`,
    };
  }
  const missed = rx.sets - last.reps.slice(0, rx.sets).filter(r => r >= top).length;
  return {
    load: last.load,
    increased: false,
    reason: `${missed} set${missed === 1 ? '' : 's'} fell short of ${top} last time. Hit ${top} on every set, then it goes up.`,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
