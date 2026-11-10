import { describe, expect, it } from 'vitest';
import { coveredLike, DISTANCES, liftedLike, seeded, WEIGHTS } from './fun';

describe('lifted like', () => {
  it('always picks something there are 2 to 20 of', () => {
    for (const kg of [10, 95, 500, 3120, 8420, 14000, 250000]) for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const r = liftedLike(kg, seed)!;
      expect(kg / r.thing.kg, `${kg} ${r.words}`).toBeGreaterThanOrEqual(2);
      expect(kg / r.thing.kg).toBeLessThanOrEqual(20);
      expect(r.count).toBeGreaterThanOrEqual(2);
    }
  });
  it('is the same every time for the same workout, and varies between workouts', () => {
    expect(liftedLike(3120, 'session-1')).toEqual(liftedLike(3120, 'session-1'));
    const picks = new Set(Array.from({ length: 40 }, (_, i) => liftedLike(3120, `s${i}`)!.thing.one));
    expect(picks.size).toBeGreaterThan(4);
  });
  it('writes halves and plurals properly', () => {
    const hippo = WEIGHTS.find(t => t.one === 'hippo')!;
    const r = Array.from({ length: 200 }, (_, i) => liftedLike(4100, `x${i}`)!).find(x => x.thing === hippo)!;
    expect(r.words).toBe('2½ hippos');
  });
  it('says nothing for a bodyweight-only session', () => {
    expect(liftedLike(0, 'a')).toBeNull();
  });
});

describe('pictures', () => {
  it('every comparison has one', () => {
    for (const t of WEIGHTS) expect(t.e, t.one).toBeTruthy();
    for (const p of DISTANCES) expect(p.e, p.name).toBeTruthy();
  });
});

describe('covered like', () => {
  it('compares a distance with a place 1 to 20 times its size', () => {
    for (const m of [400, 2400, 5000, 10000, 42195]) for (const seed of ['a', 'b', 'c']) {
      const r = coveredLike(m, seed)!;
      expect(m / r.place.m, `${m} ${r.words}`).toBeGreaterThanOrEqual(1);
      expect(m / r.place.m).toBeLessThanOrEqual(20);
    }
  });
  it('words heights, lengths and counts naturally', () => {
    const find = (name: string, m: number) => Array.from({ length: 300 }, (_, i) => coveredLike(m, `y${i}`)!).find(r => r.place.name === name)?.words;
    expect(find('the Eiffel Tower', 2400)).toBe('7 times the height of the Eiffel Tower');
    expect(find('the Golden Gate Bridge', 3000)).toBe('the length of the Golden Gate Bridge');
    expect(find('football pitch', 1500)).toBe('14 football pitches');
  });
  it('has nothing to say for a few steps', () => {
    expect(coveredLike(5, 'a')).toBeNull();
    expect(seeded('abc')).toBe(seeded('abc'));
    expect(DISTANCES.length).toBeGreaterThan(20);
  });
});
