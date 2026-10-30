import { describe, expect, it } from 'vitest';
import { suggestLoad } from './progression';

const legPress = { sets: 3, repRange: [10, 12] as [number, number], increment: 10 };

describe('suggestLoad', () => {
  it('adds the load jump when every set hit the top of the range', () => {
    const s = suggestLoad(legPress, { load: 120, reps: [12, 12, 12] });
    expect(s).toMatchObject({ load: 130, increased: true });
    expect(s.reason).toContain('12 reps on every set at 120kg');
  });

  it('holds the load when any set fell short', () => {
    const s = suggestLoad({ sets: 3, repRange: [8, 10], increment: 2.5 }, { load: 60, reps: [10, 9, 8] });
    expect(s).toMatchObject({ load: 60, increased: false });
    expect(s.reason).toBe('2 sets fell short of 10 last time. Hit 10 on every set, then it goes up.');
  });

  it('uses the singular for one missed set', () => {
    expect(suggestLoad(legPress, { load: 120, reps: [12, 12, 11] }).reason).toMatch(/^1 set fell short/);
  });

  it('does not progress when fewer sets were logged than prescribed', () => {
    expect(suggestLoad(legPress, { load: 120, reps: [12, 12] }).increased).toBe(false);
  });

  it('ignores extra sets beyond the prescription', () => {
    expect(suggestLoad(legPress, { load: 120, reps: [12, 12, 12, 8] })).toMatchObject({ load: 130, increased: true });
  });

  it('keeps fractional jumps tidy', () => {
    expect(suggestLoad({ sets: 1, repRange: [8, 10], increment: 2.5 }, { load: 57.5, reps: [10] }).load).toBe(60);
  });

  it('never changes bodyweight exercises', () => {
    expect(suggestLoad({ sets: 2, repRange: [10, 10], increment: 0 }, { load: 0, reps: [10, 10] })).toMatchObject({ load: 0, increased: false });
  });

  it('has a first-time suggestion', () => {
    expect(suggestLoad(legPress, null)).toMatchObject({ load: 0, increased: false });
  });
});
