'use client';

import { useSyncExternalStore } from 'react';
import type { Slot } from './sample-data';
import { normaliseLog, type LogItem } from './food';
import { queueSave } from './sync';

// The client app's local state. In demo mode it is the only copy and lives
// in this browser. With Supabase connected, the same shape is filled from the
// database and writes are queued here first so they survive no signal.
export type SetLog = { load: string; reps: string; done: boolean };
export type CheckIn = { step: number; mood: number; words: string; scales: Record<string, number>; aches: string; wins: Record<string, boolean>;
  photo: boolean; measure: boolean; waist: string; weight: string; support: Record<string, boolean>; note: string };

export type ClientState = {
  onb: { done: boolean; goal: string; days: number; freq: string; day: string; parq: (boolean | undefined)[]; injuries: string; consent: Record<string, boolean>; os: 'ios' | 'android' };
  scale: number;
  // Where a new client got to in sign-up, so closing the app doesn't lose it.
  onbStep: number;
  notifs: Record<string, boolean>;
  read: boolean;
  // Training. Everything about the workout in progress is kept here, so it
  // survives leaving the screen or closing the app.
  duration: number; idx: number; logs: Record<string, SetLog[]>; swaps: Record<string, string>;
  exNotes: Record<string, { rpe: number | null; note: string }>; skipped: Record<string, boolean>;
  startedAt: number | null; finishedAt: number | null;
  // Pausing stops the workout clock. between = the exercise just finished, while showing "up next".
  pausedAt: number | null; pausedMs: number; between: string | null;
  rest: { endsAt: number; total: number; pausedLeft: number | null } | null;
  pain: { area: string | null; sev: number; act: string | null; sent: boolean };
  // Bookings and payments
  sessionCancelled: boolean; sessionsLeft: number; book: { req: Record<number, string>; done: boolean };
  avail: { days: Record<string, [number, number] | null>; note: string; sent: boolean }; paid: boolean; autopay: boolean;
  // Food
  log: Record<Slot, LogItem[]>; water: number; favs: string[]; recent: string[];
  // How much of the numbers this client sees, set by Kyle: everything, protein only, or none.
  fuelMode: 'full' | 'protein' | 'simple';
  // Messages
  chat: string[]; ai: string[]; handed: boolean;
  // Questions typed to KAI and what happened to them.
  aiLog: { q: string; a: string; to: 'kai' | 'coach' | 'urgent' | 'demo' }[];
  // Community
  liked: Record<string, boolean>; comments: Record<string, string[]>;
  // Progress
  showWeight: boolean;
  checkin: CheckIn | null; checkinsSent: number;
  // When this copy was last changed (ms). The newer of phone and database wins.
  savedAt?: number;
  // Prototype-only previews of the offline and error states
  preview: { offline: boolean; payFail: boolean; fresh: boolean };
};

export const newCheckin = (): CheckIn => ({ step: 1, mood: 3, words: '', scales: { sleep: 4, energy: 3, stress: 3, food: 4, motivation: 4 }, aches: 'None',
  wins: {}, photo: false, measure: false, waist: '', weight: '', support: {}, note: '' });

const initial = (): ClientState => ({
  onb: { done: true, goal: 'strength', days: 3, freq: 'weekly', day: 'Sun', parq: [], injuries: '', consent: { terms: true, health: true, kai: true }, os: 'ios' },
  scale: 1, onbStep: 0,
  notifs: { workout: true, booking: true, session: true, payment: true, drop: true, checkin: true },
  read: false,
  duration: 60, idx: 0, logs: {}, swaps: {}, exNotes: {}, skipped: {}, startedAt: null, finishedAt: null, rest: null, pausedAt: null, pausedMs: 0, between: null,
  pain: { area: null, sev: 3, act: null, sent: false },
  sessionCancelled: false, sessionsLeft: 6, book: { req: {}, done: false },
  avail: { days: { Mon: null, Tue: [16.5, 19.5], Wed: null, Thu: [14, 19.5], Fri: null }, note: '', sent: false }, paid: false, autopay: true,
  log: { Breakfast: [{ food: 'eggs', qty: 1 }, { food: 'sourdough', qty: 1 }, { food: 'avo', qty: 1 }], Lunch: [{ food: 'wrap', qty: 1 }], Snacks: [{ food: 'yog', qty: 1 }, { food: 'berries', qty: 1 }], Dinner: [] }, water: 6,
  favs: ['wrap', 'yog'], recent: ['eggs', 'sourdough', 'avo', 'wrap', 'yog', 'berries', 'chicken', 'rice'], fuelMode: 'full',
  chat: [], ai: [], handed: false, aiLog: [],
  liked: {}, comments: {},
  showWeight: false,
  checkin: null, checkinsSent: 0,
  preview: { offline: false, payFail: false, fresh: false },
});

const KEY = 'kdpt-client-v1';
let state: ClientState = initial();
let loadedFor: string | null = null;
// Set in live mode: where to copy the client's data in the database.
let live: { clientId: string; orgId: string } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// Called once by the app shell with who is signed in. A brand-new client
// starts at onboarding with nothing logged.
export function loadStore(personId: string, isNew: boolean, remote?: { orgId: string; state: Partial<ClientState> | null }) {
  if (loadedFor === personId) return;
  loadedFor = personId;
  live = remote ? { clientId: personId, orgId: remote.orgId } : null;
  const fresh = initial();
  // A new client starts with nothing chosen, so every sign-up step needs an answer.
  // Live clients don't see sample data: until programmes and history come from
  // the database, their screens show the new-client versions.
  if (remote) fresh.preview = { ...fresh.preview, fresh: true };
  if (isNew) Object.assign(fresh, { onb: { ...fresh.onb, done: false, consent: {}, goal: '', days: 0, freq: '', day: '' }, log: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }, water: 0, favs: [], recent: [], sessionsLeft: 8, preview: { ...fresh.preview, fresh: true } });
  try {
    const saved = localStorage.getItem(`${KEY}:${personId}`);
    const local: Partial<ClientState> | null = saved ? JSON.parse(saved) : null;
    const newest = pickNewest(local, remote?.state ?? null);
    state = newest ? { ...fresh, ...newest } : fresh;
    if (remote) state.preview = { ...state.preview, fresh: true };
    state.log = normaliseLog(state.log as unknown as Record<string, unknown[]>);
  } catch {
    state = fresh;
  }
  emit();
}

export function setState(patch: Partial<ClientState> | ((s: ClientState) => Partial<ClientState>)) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch), savedAt: Date.now() };
  try { if (loadedFor) localStorage.setItem(`${KEY}:${loadedFor}`, JSON.stringify(state)); } catch { /* storage unavailable */ }
  if (live) queueSave(live.clientId, live.orgId, state);
  emit();
}

// For "set this if it isn't set yet" updates. Reads the store as it is now,
// and does nothing until the client's saved data has loaded, so a screen that
// opens first can never overwrite what was saved (a workout's start time, a
// half-finished check-in).
export function updateOnceLoaded(fn: (s: ClientState) => Partial<ClientState> | null) {
  if (!loadedFor) return;
  const patch = fn(state);
  if (patch) setState(patch);
}

export function resetStore(personId: string, isNew: boolean) {
  try { localStorage.removeItem(`${KEY}:${personId}`); } catch { /* storage unavailable */ }
  loadedFor = null;
  loadStore(personId, isNew);
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const serverSnapshot = initial();
export function useClient(): ClientState {
  return useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
}

// Clears the workout in progress (after finishing or abandoning it).
export const resetWorkout = (): Partial<ClientState> => ({ idx: 0, logs: {}, swaps: {}, exNotes: {}, skipped: {}, startedAt: null, finishedAt: null, rest: null, pausedAt: null, pausedMs: 0, between: null });

// The phone's copy and the database's copy: use whichever was changed last.
// On a tie, or if neither has a time, the phone wins (it's never behind itself).
export function pickNewest<T extends { savedAt?: number }>(local: T | null, db: T | null): T | null {
  if (!db) return local;
  if (!local) return db;
  return (db.savedAt ?? 0) > (local.savedAt ?? 0) ? db : local;
}
