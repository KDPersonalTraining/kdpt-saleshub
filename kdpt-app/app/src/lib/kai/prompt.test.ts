import { describe, expect, it } from 'vitest';
import { buildProgress } from '@/lib/client/progress';
import type { LiveData } from '@/lib/client/live';
import { KAI_SYSTEM, clientContext } from './prompt';

const ex = { id: 'we', lib: 'lp', name: 'Leg Press', sets: 3, reps: [10, 12] as [number, number], rest: 90, inc: 10, priority: 'must_keep' as const, setup: 1, kit: 'machine' as const,
  last: { load: 100, reps: [12, 11, 10] }, alts: [['Hack Squat', 'Same movement', 'machine']] as [string, string, string][], exerciseId: 'e', cues: [], note: 'Slow down', best: 0, measure: 'reps' as const };
const live: LiveData = {
  orgId: 'o', sessions: [], checkin: null, progress: buildProgress([]), bookings: [], weights: [{ date: '2026-11-01', kg: 80 }], library: [], kaiConsent: true,
  nutrition: { mode: 'simple', kcal: 2000, P: 140, C: 200, F: 70, notes: null },
  plan: { id: 'p', name: 'Upper / Lower', weeks: 8, startsOn: '2026-11-02', week: 2, thisWeek: ['w'], nextId: 'w', doneThisWeek: [],
    workouts: [{ id: 'w', name: 'Lower A', focus: null, phase: null, order: 1, weekFrom: null, weekTo: null, exercises: [ex] }] },
};

describe('what KAI is told', () => {
  it('gets the plan, last results, notes and allowed swaps with consent', () => {
    const c = clientContext('Sam', live, true);
    expect(c).toContain('Upper / Lower, week 2 of 8');
    expect(c).toContain('Leg Press 3x10-12 (last time 100 kg x 12/11/10)');
    expect(c).toContain("Kyle's note: Slow down");
    expect(c).toContain('swaps Kyle allows: Hack Squat');
  });
  it('gets no numbers when Kyle chose no numbers, and never weight or health', () => {
    const c = clientContext('Sam', live, true);
    expect(c).toContain('do not give them numbers');
    expect(c).not.toContain('2000');
    expect(c).not.toMatch(/80 ?kg|injur|health|PAR-Q/i);
  });
  it('gets only a first name without consent', () => {
    const c = clientContext('Sam', live, false);
    expect(c).not.toContain('Leg Press');
    expect(c).toContain('general guidance only');
  });
  it('the standing instructions hand medical questions to Kyle and stay the same for everyone', () => {
    expect(KAI_SYSTEM).toMatch(/never diagnose/);
    expect(KAI_SYSTEM).toMatch(/999/);
    expect(KAI_SYSTEM).not.toMatch(/\$\{/);
  });
});
