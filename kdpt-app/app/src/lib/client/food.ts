import { FOODS, SLOTS, type Food, type Slot } from './sample-data';

// One thing logged: a food and how many servings of it.
export type LogItem = { food: string; qty: number };
export type Totals = { kcal: number; P: number; C: number; F: number };

// Foods typed in with Quick add are stored as "quick:kcal:P:C:F".
export function resolveFood(id: string): Food | undefined {
  if (!id.startsWith('quick:')) return FOODS.find(f => f.id === id);
  const [, kcal, P, C, F] = id.split(':').map(Number);
  return { id, n: 'Quick add', p: 'Entered by you', kcal, P, C, F };
}

export const QTY_MIN = 0.25, QTY_MAX = 20;
export const clampQty = (q: number) => Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(q * 4) / 4));

export function scaled(f: Food, qty: number): Totals {
  return { kcal: f.kcal * qty, P: f.P * qty, C: f.C * qty, F: f.F * qty };
}

export function totals(log: Record<Slot, LogItem[]>): Totals {
  const t: Totals = { kcal: 0, P: 0, C: 0, F: 0 };
  for (const sl of SLOTS) for (const it of log[sl] ?? []) {
    const f = resolveFood(it.food); if (!f) continue;
    const x = scaled(f, it.qty);
    t.kcal += x.kcal; t.P += x.P; t.C += x.C; t.F += x.F;
  }
  return t;
}

// How much of a serving, in words: "2 × 1 slice", "200 g".
export function portionLabel(f: Food, qty: number): string {
  if (f.g) return `${Math.round(f.g * qty)} g`;
  return qty === 1 ? f.p : `${qty} servings · ${f.p} each`;
}

// Older saved logs stored bare food ids; read them as one serving each.
export function normaliseLog(log: Record<string, unknown[]> | undefined): Record<Slot, LogItem[]> {
  const out = { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] } as Record<Slot, LogItem[]>;
  for (const sl of SLOTS) for (const it of log?.[sl] ?? []) {
    if (typeof it === 'string') out[sl].push({ food: it, qty: 1 });
    else if (it && typeof it === 'object' && typeof (it as LogItem).food === 'string') out[sl].push({ food: (it as LogItem).food, qty: clampQty(Number((it as LogItem).qty) || 1) });
  }
  return out;
}
