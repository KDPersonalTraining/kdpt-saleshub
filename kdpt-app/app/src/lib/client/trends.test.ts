import { describe as group, expect, it } from 'vitest';
import { describe, isoFromShort, movingAverage, windowChange } from './trends';

const pts = [['2026-09-01', 100], ['2026-09-15', 110], ['2026-10-06', 120], ['2026-10-19', 130]].map(([date, value]) => ({ date: date as string, value: value as number }));

group('windowChange', () => {
  it('compares against the last record before the period starts', () => {
    const c = windowChange(pts, 30, '2026-10-21')!;
    expect(c.from.date).toBe('2026-09-15');
    expect(c).toMatchObject({ delta: 20, sinceStart: false });
  });
  it('says "since you started" when history is shorter than the period', () => {
    const c = windowChange(pts, 180, '2026-10-21')!;
    expect(c).toMatchObject({ delta: 30, pct: 30, sinceStart: true });
    expect(c.from.date).toBe('2026-09-01');
  });
  it('needs at least two records', () => {
    expect(windowChange(pts.slice(0, 1), 30, '2026-10-21')).toBeNull();
  });
});

group('describe', () => {
  const c = windowChange(pts, 180, '2026-10-21')!;
  it('is positive only when the change matches the goal', () => {
    expect(describe(c, ' kg', 'up')).toEqual({ text: 'Up 30 kg since you started (7 weeks)', tone: 'good' });
    expect(describe(c, ' kg', 'down').tone).toBe('watch');
    expect(describe(c, ' kg', 'either').tone).toBe('neutral');
  });
});

group('movingAverage', () => {
  it('smooths day-to-day noise', () => {
    const daily = [70, 72, 70, 72].map((v, i) => ({ date: `2026-10-0${i + 1}`, value: v }));
    expect(movingAverage(daily, 2).map(p => p.value)).toEqual([70, 71, 71, 71]);
  });
});

group('isoFromShort', () => {
  it('reads sample dates', () => { expect(isoFromShort('1 Sep')).toBe('2026-09-01'); expect(isoFromShort('19 Oct')).toBe('2026-10-19'); });
});
