import { describe, expect, it, vi } from 'vitest';

// The store talks to the browser; only the merge rule is tested here.
vi.mock('./sync', () => ({ queueSave: () => {} }));
const { pickNewest } = await import('./store');

describe('pickNewest', () => {
  it('uses the database copy when it was changed later (e.g. on another phone)', () => {
    expect(pickNewest({ savedAt: 1, v: 'phone' }, { savedAt: 2, v: 'db' })).toMatchObject({ v: 'db' });
  });
  it('keeps the phone copy when it is newer (logged offline, not sent yet)', () => {
    expect(pickNewest({ savedAt: 3, v: 'phone' }, { savedAt: 2, v: 'db' })).toMatchObject({ v: 'phone' });
  });
  it('handles a missing copy on either side', () => {
    expect(pickNewest(null, { savedAt: 1 })).toEqual({ savedAt: 1 });
    expect(pickNewest({ savedAt: 1 }, null)).toEqual({ savedAt: 1 });
    expect(pickNewest(null, null)).toBeNull();
  });
  it('prefers the phone on a tie', () => {
    expect(pickNewest({ savedAt: 5, v: 'phone' }, { savedAt: 5, v: 'db' })).toMatchObject({ v: 'phone' });
  });
});

describe('a new day of food', () => {
  it('starts the log empty and keeps the day before as totals', async () => {
    const { rollFoodDay } = await import('./store');
    const log = { Breakfast: [{ food: 'eggs', qty: 1 }], Lunch: [], Snacks: [], Dinner: [] };
    expect(rollFoodDay({ log, water: 3, logDay: undefined, foodHistory: undefined }, '2026-11-12')).toEqual({ logDay: '2026-11-12' });
    expect(rollFoodDay({ log, water: 3, logDay: '2026-11-12', foodHistory: undefined }, '2026-11-12')).toEqual({});
    const next = rollFoodDay({ log, water: 3, logDay: '2026-11-12', foodHistory: {} }, '2026-11-13');
    expect(next.log).toEqual({ Breakfast: [], Lunch: [], Snacks: [], Dinner: [] });
    expect(next.water).toBe(0);
    expect(next.foodHistory?.['2026-11-12'].kcal).toBe(150);
  });
});
