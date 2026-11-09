'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { cancellationOutcome } from '@/lib/rules';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ukToIso, ukWhen } from '@/lib/time';

// A client acts on one of their own sessions. Clients can read their bookings
// but not change them directly, so after checking it's theirs, the change is
// made with the server-only key.
async function mine(id: string) {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'client' || !me.orgId) return null;
  const sb = await createClient();
  const { data: b } = await sb.from('bookings').select('id, starts_at, ends_at, status').eq('id', id).eq('client_id', me.id).maybeSingle();
  return b ? { me, sb, b } : null;
}
const note = async (sb: Awaited<ReturnType<typeof createClient>>, me: { id: string; orgId?: string }, body: string) =>
  sb.from('messages').insert({ org_id: me.orgId, client_id: me.id, sender_id: me.id, sender_kind: 'client', body });

export async function acceptSession(id: string): Promise<string | null> {
  const m = await mine(id); if (!m) return 'Session not found.';
  if (m.b.status !== 'held') return null;
  const { error } = await createAdminClient().from('bookings').update({ status: 'confirmed' }).eq('id', id).eq('status', 'held');
  revalidatePath('/sessions');
  return error ? 'Couldn’t confirm it. Try again.' : null;
}

export async function cancelMine(id: string): Promise<{ error: string | null; late: boolean }> {
  const m = await mine(id); if (!m) return { error: 'Session not found.', late: false };
  if (!['held', 'confirmed'].includes(m.b.status)) return { error: 'This session is already cancelled or finished.', late: false };
  const late = m.b.status === 'confirmed' && cancellationOutcome(Date.parse(m.b.starts_at), Date.now()) === 'counts_as_used';
  const { error } = await createAdminClient().from('bookings').update({ status: late ? 'late_cancelled' : 'cancelled', cancelled_at: new Date().toISOString(), counts_against_allowance: late }).eq('id', id);
  if (error) return { error: 'Couldn’t cancel it. Try again, or message Kyle.', late };
  await note(m.sb, m.me, `I’ve cancelled our session on ${ukWhen(m.b.starts_at)}${late ? ' (less than 24 hours’ notice)' : ''}.`);
  revalidatePath('/sessions');
  return { error: null, late };
}

export async function requestChange(id: string, date: string, time: string, text: string): Promise<string | null> {
  const m = await mine(id); if (!m) return 'Session not found.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return 'Choose a day and time.';
  const at = ukToIso(date, time);
  if (Date.parse(at) < Date.now()) return 'Choose a time in the future.';
  const { data: open } = await m.sb.from('booking_change_requests').select('id').eq('booking_id', id).eq('status', 'pending').maybeSingle();
  if (open) return 'You’ve already asked to move this one. Kyle will reply soon.';
  const { error } = await m.sb.from('booking_change_requests').insert({ org_id: m.me.orgId, client_id: m.me.id, booking_id: id, requested_starts_at: at, client_note: text.trim().slice(0, 300) || null, status: 'pending' });
  if (error) return 'Couldn’t send it. Try again.';
  await note(m.sb, m.me, `Could we move our session on ${ukWhen(m.b.starts_at)} to ${ukWhen(at)}?${text.trim() ? ` ${text.trim()}` : ''}`);
  revalidatePath('/sessions');
  return null;
}
