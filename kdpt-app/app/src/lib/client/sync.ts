'use client';

import { browserClient } from '@/lib/supabase/browser';

// Copies the client's app data to the database (live mode only). The phone's
// copy is saved first, so a lost signal never loses anything; this sends the
// latest copy a moment after each change, and again when the signal returns.
// Each save carries the time it was made, so the newer copy always wins.
type Pending = { clientId: string; orgId: string; state: unknown } | null;
let pending: Pending = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let status: 'saved' | 'saving' | 'offline' | 'error' = 'saved';
const watchers = new Set<(s: typeof status) => void>();
const setStatus = (s: typeof status) => { status = s; watchers.forEach(w => w(s)); };
export const onSyncStatus = (w: (s: typeof status) => void) => { watchers.add(w); w(status); return () => { watchers.delete(w); }; };

export function queueSave(clientId: string, orgId: string, state: unknown) {
  pending = { clientId, orgId, state };
  clearTimeout(timer);
  timer = setTimeout(flush, 1500);
}

async function flush() {
  const job = pending; if (!job) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return; }
  const sb = browserClient(); if (!sb) return;
  setStatus('saving');
  const { error } = await sb.from('client_app_state').upsert({ client_id: job.clientId, org_id: job.orgId, state: job.state, updated_at: new Date().toISOString() });
  if (error) { setStatus(navigator.onLine ? 'error' : 'offline'); timer = setTimeout(flush, 15000); return; }
  if (pending === job) pending = null;
  setStatus('saved');
}

if (typeof window !== 'undefined') window.addEventListener('online', () => { void flush(); });

// Finished workouts. Each one waits in an outbox on the phone until the
// database has it, so a workout finished with no signal is sent later. Ids are
// made on the phone, so sending the same one twice changes nothing.
export type SessionJob = { session: Record<string, unknown> & { id: string }; sets: (Record<string, unknown> & { id: string })[] };
const OUTBOX = 'kdpt-outbox-v1';
const readOutbox = (): SessionJob[] => { try { return JSON.parse(localStorage.getItem(OUTBOX) ?? '[]'); } catch { return []; } };
const writeOutbox = (jobs: SessionJob[]) => { try { localStorage.setItem(OUTBOX, JSON.stringify(jobs)); } catch { /* storage unavailable */ } };

export function queueSession(job: SessionJob) {
  writeOutbox([...readOutbox().filter(j => j.session.id !== job.session.id), job]);
  return flushOutbox();
}

let flushing: Promise<boolean> | null = null;
// Sends everything waiting. True when the outbox is empty afterwards.
export function flushOutbox(): Promise<boolean> {
  return (flushing ??= (async () => {
    try {
      const sb = browserClient();
      if (!sb || (typeof navigator !== 'undefined' && !navigator.onLine)) return readOutbox().length === 0;
      for (const job of readOutbox()) {
        const { error: e1 } = await sb.from('workout_sessions').upsert(job.session);
        if (e1) continue;
        const { error: e2 } = job.sets.length ? await sb.from('set_logs').upsert(job.sets) : { error: null };
        if (e2) continue;
        writeOutbox(readOutbox().filter(j => j.session.id !== job.session.id));
      }
      return readOutbox().length === 0;
    } finally { flushing = null; }
  })());
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushOutbox(); });
  setTimeout(() => { void flushOutbox(); }, 3000);
}
