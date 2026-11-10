import { describe, expect, it } from 'vitest';
import { weekDays } from './week';

describe('this week', () => {
  it('runs Monday to Sunday around today, marking trained days', () => {
    const d = weekDays('2026-11-11', ['2026-11-09', '2026-11-11', '2026-11-02']);
    expect(d.map(x => x.date)).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
    expect(d.filter(x => x.done).map(x => x.label)).toEqual(['M', 'W']);
    expect(d.findIndex(x => x.today)).toBe(2);
  });
  it('handles Sunday as the end of the week', () => {
    expect(weekDays('2026-11-15', [])[6].today).toBe(true);
  });
});
