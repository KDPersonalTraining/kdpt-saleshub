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
