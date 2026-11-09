import { describe, expect, it } from 'vitest';
import { addWeeksUk, isoToUk, ukToIso, ukWhen } from './time';

describe('UK time', () => {
  it('converts winter and summer clock times', () => {
    expect(ukToIso('2026-11-12', '07:00')).toBe('2026-11-12T07:00:00.000Z');
    expect(ukToIso('2026-07-01', '07:00')).toBe('2026-07-01T06:00:00.000Z');
  });
  it('round-trips, and keeps the clock time across the clocks changing', () => {
    expect(isoToUk('2026-07-01T06:00:00.000Z')).toEqual({ date: '2026-07-01', time: '07:00', weekday: 'Wed' });
    const dates = [0, 1, 2, 3, 4, 5].map(n => addWeeksUk('2026-10-15', n));
    expect(dates.map(d => isoToUk(ukToIso(d, '18:30')).time)).toEqual(Array(6).fill('18:30'));
    expect(dates[2]).toBe('2026-10-29');
  });
  it('writes a moment in words', () => {
    expect(ukWhen('2026-11-12T07:00:00Z')).toBe('Thu 12 Nov, 07:00');
  });
});
