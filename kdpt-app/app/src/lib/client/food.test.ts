import { describe, expect, it } from 'vitest';
import { clampQty, normaliseLog, portionLabel, resolveFood, totals } from './food';

describe('food logging', () => {
  it('scales totals by servings', () => {
    const t = totals({ Breakfast: [{ food: 'eggs', qty: 2 }], Lunch: [{ food: 'chicken', qty: 0.5 }], Snacks: [], Dinner: [] });
    expect(t.kcal).toBe(150 * 2 + 165 * 0.5);
    expect(t.P).toBe(13 * 2 + 31 * 0.5);
  });
  it('reads quick-add entries', () => {
    expect(resolveFood('quick:300:20:30:10')).toMatchObject({ kcal: 300, P: 20, C: 30, F: 10 });
    expect(totals({ Breakfast: [{ food: 'quick:300:20:30:10', qty: 1 }], Lunch: [], Snacks: [], Dinner: [] }).kcal).toBe(300);
  });
  it('ignores foods it no longer knows', () => {
    expect(totals({ Breakfast: [{ food: 'gone', qty: 1 }], Lunch: [], Snacks: [], Dinner: [] }).kcal).toBe(0);
  });
  it('keeps portions sensible', () => {
    expect(clampQty(0)).toBe(0.25);
    expect(clampQty(1.3)).toBe(1.25);
    expect(clampQty(99)).toBe(20);
  });
  it('describes portions in grams where a food is weighed', () => {
    expect(portionLabel(resolveFood('chicken')!, 1.5)).toBe('225 g');
    expect(portionLabel(resolveFood('sourdough')!, 2)).toBe('2 servings · 1 slice each');
    expect(portionLabel(resolveFood('sourdough')!, 1)).toBe('1 slice');
  });
  it('upgrades old saved logs', () => {
    expect(normaliseLog({ Breakfast: ['eggs', { food: 'avo', qty: 2 }, 5], Lunch: [] })).toEqual({ Breakfast: [{ food: 'eggs', qty: 1 }, { food: 'avo', qty: 2 }], Lunch: [], Snacks: [], Dinner: [] });
  });
});
