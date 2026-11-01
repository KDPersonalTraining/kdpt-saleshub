import { describe, expect, it } from 'vitest';
import { cancellationOutcome, daysOfMonth, generateMonth, nextState, toMinutes, type Hours } from './booking';

// Kyle: 6:30–19:30, Wednesday until 13:00, weekends off.
const H: Hours = { 0: [390, 1170], 1: [390, 1170], 2: [390, 780], 3: [390, 1170], 4: [390, 1170], 5: null, 6: null };
const sarah = [{ client: 'Sarah', weekday: 0 as const, start: toMinutes('7:00'), minutes: 60, location: 'Studio' }, { client: 'Sarah', weekday: 3 as const, start: toMinutes('7:00'), minutes: 60, location: 'Studio' }];

describe('daysOfMonth', () => {
  it('knows November 2026 starts on a Sunday and has 30 days', () => {
    const d = daysOfMonth(2026, 11);
    expect(d).toHaveLength(30);
    expect(d[0]).toEqual({ date: '2026-11-01', weekday: 6 });
    expect(d[1]).toEqual({ date: '2026-11-02', weekday: 0 });
  });
  it('handles February in a leap year', () => {
    expect(daysOfMonth(2028, 2)).toHaveLength(29);
  });
});

describe('generateMonth', () => {
  it('turns Monday and Thursday 7:00 into November 2026\'s 9 slots (five Mondays)', () => {
    const p = generateMonth({ year: 2026, month: 11, patterns: sarah, hours: H });
    expect(p.map(x => x.date)).toEqual(['2026-11-02', '2026-11-05', '2026-11-09', '2026-11-12', '2026-11-16', '2026-11-19', '2026-11-23', '2026-11-26', '2026-11-30']);
    expect(p.every(x => !x.problem && x.end - x.start === 60)).toBe(true);
  });
  it('stops at the package allowance and flags the extra slot', () => {
    const p = generateMonth({ year: 2026, month: 11, patterns: sarah, hours: H, allowance: { Sarah: 8 } });
    expect(p.filter(x => !x.problem)).toHaveLength(8);
    expect(p[8]).toMatchObject({ date: '2026-11-30', problem: 'over_allowance' });
  });
  it('gives a lost slot back to the allowance, so a blocked day frees one later', () => {
    const p = generateMonth({ year: 2026, month: 11, patterns: sarah, hours: H, allowance: { Sarah: 8 }, holidays: ['2026-11-02'] });
    expect(p.filter(x => !x.problem).map(x => x.date).at(-1)).toBe('2026-11-30');
  });
  it('flags holidays and blocked time instead of dropping them', () => {
    const p = generateMonth({ year: 2026, month: 11, patterns: sarah, hours: H, holidays: ['2026-11-02'], busy: [{ date: '2026-11-05', start: 400, end: 480, reason: 'Dentist' }] });
    expect(p[0]).toMatchObject({ date: '2026-11-02', problem: 'holiday' });
    expect(p[1]).toMatchObject({ date: '2026-11-05', problem: 'blocked', detail: 'Dentist' });
    expect(p.filter(x => x.problem)).toHaveLength(2);
  });
  it('respects the Wednesday half day', () => {
    const p = generateMonth({ year: 2026, month: 11, patterns: [{ client: 'Ellie', weekday: 2, start: toMinutes('12:30'), minutes: 60, location: 'Online' }], hours: H });
    expect(p[0]).toMatchObject({ problem: 'outside_hours' });
  });
  it('catches two clients in the same slot; the first pattern keeps it', () => {
    const p = generateMonth({ year: 2026, month: 11, hours: H, patterns: [...sarah, { client: 'Tom', weekday: 0, start: toMinutes('7:30'), minutes: 60, location: 'Studio' }] });
    const tom = p.filter(x => x.client === 'Tom');
    expect(tom[0]).toMatchObject({ problem: 'clash', detail: 'Clashes with Sarah at 7:00' });
  });
  it('allows back-to-back sessions at one gym but not across gyms without travel time', () => {
    const travel = (a: string, b: string) => (a === b ? 0 : 20);
    const back = { client: 'Mark', weekday: 0 as const, start: toMinutes('8:00'), minutes: 60, location: 'Studio' };
    expect(generateMonth({ year: 2026, month: 11, hours: H, travel, patterns: [...sarah, back] }).find(x => x.client === 'Mark')!.problem).toBeUndefined();
    const elsewhere = { ...back, location: 'Gym' };
    expect(generateMonth({ year: 2026, month: 11, hours: H, travel, patterns: [...sarah, elsewhere] }).find(x => x.client === 'Mark')).toMatchObject({ problem: 'travel' });
  });
  it('checks against sessions already booked', () => {
    const p = generateMonth({ year: 2026, month: 11, hours: H, patterns: sarah, existing: [{ client: 'Priya', date: '2026-11-12', start: 420, end: 480, location: 'Studio' }] });
    expect(p.find(x => x.date === '2026-11-12')).toMatchObject({ problem: 'clash' });
  });
});

describe('booking states', () => {
  it('follows the normal path to confirmed', () => {
    let s = nextState('proposed', 'send');
    expect(s).toBe('awaiting_client');
    s = nextState(s, 'client_accept');
    expect(s).toBe('awaiting_coach');
    expect(nextState(s, 'coach_approve')).toBe('confirmed');
  });
  it('handles a change request and an offered alternative', () => {
    const s = nextState('awaiting_client', 'client_request_change');
    expect(s).toBe('change_requested');
    expect(nextState(s, 'coach_offer_time')).toBe('awaiting_client');
  });
  it('only skips Kyle when automatic confirmation is on', () => {
    expect(nextState('awaiting_client', 'client_accept', { autoConfirm: true })).toBe('confirmed');
  });
  it('refuses impossible moves', () => {
    expect(() => nextState('proposed', 'coach_approve')).toThrow();
    expect(() => nextState('cancelled', 'send')).toThrow();
  });
});

describe('cancellation', () => {
  const start = Date.UTC(2026, 10, 5, 7);
  it('is free with 24 hours or more notice', () => {
    expect(cancellationOutcome(start, start - 24 * 3600_000)).toBe('free');
  });
  it('counts as used inside 24 hours', () => {
    expect(cancellationOutcome(start, start - 23 * 3600_000)).toBe('counts_as_used');
  });
});
