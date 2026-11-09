'use client';

import { createContext, useContext } from 'react';
import type { Exercise } from './sample-data';
import { WORKOUT } from './sample-data';
import type { ClientState } from './store';
import type { CheckInQuestion } from '@/lib/checkins/questions';
import type { Progress } from './progress';

// What the client app reads from the database in live mode. Loaded on the
// server for each visit (see the client layout) and shared with every screen.
// altIds: each swap's name → its exercise id, so a swapped set is logged against what was really done.
export type PlanExercise = Exercise & { exerciseId: string; cues: string[]; note: string | null; best: number; altIds?: Record<string, string> };
export type PlanWorkout = { id: string; name: string; focus: string | null; phase: string | null; order: number; weekFrom: number | null; weekTo: number | null; exercises: PlanExercise[] };
export type SessionSummary = { id: string; workout: string; startedAt: string; minutes: number | null; volume: number; distance: number; sets: [string, string[]][] };
export type LivePlan = {
  id: string; name: string; weeks: number | null; startsOn: string | null; week: number;
  workouts: PlanWorkout[]; thisWeek: string[]; nextId: string | null; doneThisWeek: string[];
};
export type LiveCheckIn = {
  formId: string; round: string; nextRound: string; freq: 'weekly' | 'fortnightly' | 'monthly';
  questions: CheckInQuestion[]; submittedAt: string | null; reply: string | null;
};
export type LiveData = { orgId: string; plan: LivePlan | null; sessions: SessionSummary[]; checkin: LiveCheckIn | null; progress: Progress };

const Ctx = createContext<LiveData | null>(null);
export const LiveProvider = ({ value, children }: { value: LiveData | null; children: React.ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// Null in demo mode.
export const useLive = () => useContext(Ctx);

// The workout to show in workout mode: the one in progress, else the one
// chosen on Train, else the next in the rotation. Demo mode uses the sample.
export type CurrentWorkout = { id: string | null; name: string; exercises: (Exercise & Partial<PlanExercise>)[] };
export function useCurrentWorkout(s: Pick<ClientState, 'wid' | 'preview'>): CurrentWorkout | null {
  const live = useLive();
  // Demo: the sample workout, except for the brand-new client who has none yet.
  if (!live) return s.preview.fresh ? null : { id: null, ...WORKOUT };
  const p = live.plan;
  if (!p) return null;
  const w = p.workouts.find(x => x.id === s.wid) ?? p.workouts.find(x => x.id === p.nextId);
  return w && w.exercises.length ? { id: w.id, name: w.name, exercises: w.exercises } : null;
}
