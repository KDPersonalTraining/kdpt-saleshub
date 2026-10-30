'use client';

import { useSyncExternalStore } from 'react';
import type { Slot } from './sample-data';

// The client app's local state. In demo mode it is the only copy and lives
// in this browser. With Supabase connected, the same shape is filled from the
// database and writes are queued here first so they survive no signal.
export type SetLog = { load: string; reps: string; done: boolean };
export type CheckIn = { step: number; mood: number; words: string; scales: Record<string, number>; aches: string; wins: Record<string, boolean>;
  photo: boolean; measure: boolean; waist: string; weight: string; support: Record<string, boolean>; note: string };

export type ClientState = {
  onb: { done: boolean; goal: string; days: number; freq: string; day: string; parq: (boolean | undefined)[]; injuries: string; consent: Record<string, boolean>; os: 'ios' | 'android' };
  scale: number;
  notifs: Record<string, boolean>;
  read: boolean;
  // Training
  duration: number; idx: number; logs: Record<string, SetLog[]>; swaps: Record<string, string>; finishedAt: number | null;
  pain: { area: string | null; sev: number; act: string | null; sent: boolean };
  // Bookings and payments
  sessionCancelled: boolean; sessionsLeft: number; book: { req: Record<number, string>; done: boolean };
  avail: { days: Record<string, [number, number] | null>; note: string; sent: boolean }; paid: boolean; autopay: boolean;
  // Food
  log: Record<Slot, string[]>; water: number;
  // Messages
  chat: string[]; ai: string[]; handed: boolean;
  // Community
  liked: Record<string, boolean>; comments: Record<string, string[]>;
  // Progress
  showWeight: boolean;
  checkin: CheckIn | null; checkinsSent: number;
  // Prototype-only previews of the offline and error states
  preview: { offline: boolean; payFail: boolean; fresh: boolean };
};

export const newCheckin = (): CheckIn => ({ step: 1, mood: 3, words: '', scales: { sleep: 4, energy: 3, stress: 3, food: 4, motivation: 4 }, aches: 'None',
  wins: {}, photo: false, measure: false, waist: '', weight: '', support: {}, note: '' });

const initial = (): ClientState => ({
  onb: { done: true, goal: 'strength', days: 3, freq: 'weekly', day: 'Sun', parq: [], injuries: '', consent: { terms: true, health: true, kai: true }, os: 'ios' },
  scale: 1,
  notifs: { workout: true, booking: true, session: true, payment: true, drop: true, checkin: true },
  read: false,
  duration: 60, idx: 0, logs: {}, swaps: {}, finishedAt: null,
  pain: { area: null, sev: 3, act: null, sent: false },
  sessionCancelled: false, sessionsLeft: 6, book: { req: {}, done: false },
  avail: { days: { Mon: null, Tue: [16.5, 19.5], Wed: null, Thu: [14, 19.5], Fri: null }, note: '', sent: false }, paid: false, autopay: true,
  log: { Breakfast: ['eggs', 'sourdough', 'avo'], Lunch: ['wrap'], Snacks: ['yog', 'berries'], Dinner: [] }, water: 6,
  chat: [], ai: [], handed: false,
  liked: {}, comments: {},
  showWeight: false,
  checkin: null, checkinsSent: 0,
  preview: { offline: false, payFail: false, fresh: false },
});

const KEY = 'kdpt-client-v1';
let state: ClientState = initial();
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// Called once by the app shell with who is signed in. A brand-new client
// starts at onboarding with nothing logged.
export function loadStore(personId: string, isNew: boolean) {
  if (loadedFor === personId) return;
  loadedFor = personId;
  const fresh = initial();
  if (isNew) Object.assign(fresh, { onb: { ...fresh.onb, done: false, consent: {} }, log: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }, water: 0, sessionsLeft: 8, preview: { ...fresh.preview, fresh: true } });
  try {
    const saved = localStorage.getItem(`${KEY}:${personId}`);
    state = saved ? { ...fresh, ...JSON.parse(saved) } : fresh;
  } catch {
    state = fresh;
  }
  emit();
}

export function setState(patch: Partial<ClientState> | ((s: ClientState) => Partial<ClientState>)) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  try { if (loadedFor) localStorage.setItem(`${KEY}:${loadedFor}`, JSON.stringify(state)); } catch { /* storage unavailable */ }
  emit();
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
