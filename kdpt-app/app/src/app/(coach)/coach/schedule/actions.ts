'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { addWeeksUk, ukToIso, ukWhen } from '@/lib/time';

async function coach() {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return null;
  return { me, sb: await createClient() };
}
const refresh = () => { revalidatePath('/coach/schedule'); revalidatePath('/coach'); };
const clash = (e: { code?: string } | null) => e?.code === '23P01';
const tell = async (sb: Awaited<ReturnType<typeof createClient>>, me: { id: string; orgId?: string }, clientId: string, body: string) =>
  sb.from('messages').insert({ org_id: me.orgId, client_id: clientId, sender_id: me.id, sender_kind: 'coach', body, read_by_coach_at: new Date().toISOString() });

// Kyle adds sessions: one, or the same time each week for a few weeks.
// "needsOk": the client confirms each one in the app; otherwise it's confirmed.
export async function addSessions(v: { clientId: string; date: string; time: string; minutes: number; locationId: string; weeks: number; needsOk: boolean; message: boolean }):
  Promise<{ error: string | null; added: number; clashes: string[] }> {
  const c = await coach(); if (!c) return { error: 'Only the coach can add sessions.', added: 0, clashes: [] };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.time)) return { error: 'Choose a date and time.', added: 0, clashes: [] };
  if (!(v.minutes >= 15 && v.minutes <= 240)) return { error: 'Sessions are 15 minutes to 4 hours.', added: 0, clashes: [] };
  const weeks = Math.max(1, Math.min(12, Math.floor(v.weeks)));
  const clashes: string[] = [];
  let added = 0;
  for (let i = 0; i < weeks; i++) {
    const start = ukToIso(addWeeksUk(v.date, i), v.time), end = new Date(Date.parse(start) + v.minutes * 60000).toISOString();
    if (Date.parse(start) < Date.now() - 3600000) { clashes.push(`${ukWhen(start)} (in the past)`); continue; }
    const { error } = await c.sb.from('bookings').insert({ org_id: c.me.orgId, client_id: v.clientId, coach_id: c.me.id, location_id: v.locationId, starts_at: start, ends_at: end, status: v.needsOk ? 'held' : 'confirmed' });
    if (clash(error)) clashes.push(ukWhen(start));
    else if (error) return { error: 'Couldn’t save the sessions. Try again.', added, clashes };
    else added += 1;
  }
  if (added && v.message) await tell(c.sb, c.me, v.clientId, v.needsOk
    ? `I’ve added ${added === 1 ? 'a session' : `${added} sessions`} for you. Please confirm ${added === 1 ? 'it' : 'them'} in the app (Home → Sessions).`
    : `I’ve booked ${added === 1 ? 'a session' : `${added} sessions`} for you. You’ll find ${added === 1 ? 'it' : 'them'} under Sessions in the app.`);
  refresh();
  return { error: null, added, clashes };
}

// Cancel, or record what happened: done or no-show.
export async function setSession(id: string, to: 'cancelled' | 'completed' | 'no_show', note?: string): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const { data, error } = await c.sb.from('bookings').update({ status: to, ...(to === 'cancelled' ? { cancelled_at: new Date().toISOString(), counts_against_allowance: false } : {}) })
    .eq('id', id).select('client_id, starts_at').single();
  if (error || !data) return 'Couldn’t save. Try again.';
  if (to === 'cancelled') await tell(c.sb, c.me, data.client_id, `I’ve had to cancel our session on ${ukWhen(data.starts_at)}.${note?.trim() ? ` ${note.trim()}` : ''} It doesn’t count against your sessions.`);
  refresh();
  return null;
}

// Kyle answers a client's request for a different time.
export async function decideChange(requestId: string, approve: boolean, reply: string): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const { data: r } = await c.sb.from('booking_change_requests').select('id, booking_id, client_id, requested_starts_at, status, bookings(starts_at, ends_at)').eq('id', requestId).maybeSingle();
  const req = r as unknown as { id: string; booking_id: string; client_id: string; requested_starts_at: string; status: string; bookings: { starts_at: string; ends_at: string } | null } | null;
  if (!req || req.status !== 'pending' || !req.bookings) return 'That request has already been answered.';
  if (approve) {
    const len = Date.parse(req.bookings.ends_at) - Date.parse(req.bookings.starts_at);
    const { error } = await c.sb.from('bookings').update({ starts_at: req.requested_starts_at, ends_at: new Date(Date.parse(req.requested_starts_at) + len).toISOString(), status: 'confirmed' }).eq('id', req.booking_id);
    if (clash(error)) return 'You already have a session at that time. Decline it with a note suggesting another time.';
    if (error) return 'Couldn’t move the session. Try again.';
  }
  await c.sb.from('booking_change_requests').update({ status: approve ? 'approved' : 'declined', coach_reply: reply.trim() || null, decided_at: new Date().toISOString() }).eq('id', requestId);
  await tell(c.sb, c.me, req.client_id, approve
    ? `Done, your session is now ${ukWhen(req.requested_starts_at)}.${reply.trim() ? ` ${reply.trim()}` : ''}`
    : `I can’t do ${ukWhen(req.requested_starts_at)}, so your session stays at ${ukWhen(req.bookings.starts_at)}.${reply.trim() ? ` ${reply.trim()}` : ''}`);
  refresh();
  return null;
}

export async function addLocation(name: string): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const n = name.trim().slice(0, 60); if (!n) return 'Give it a name.';
  const { error } = await c.sb.from('locations').insert({ org_id: c.me.orgId, name: n });
  refresh();
  return error ? 'Couldn’t save. Try again.' : null;
}
