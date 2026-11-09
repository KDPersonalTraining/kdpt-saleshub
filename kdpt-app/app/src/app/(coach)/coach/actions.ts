'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// Kyle has seen a pain report. A reply also goes to the client's messages.
export async function reviewPain(id: string, reply: string): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can do this.';
  const sb = await createClient(), text = reply.trim().slice(0, 4000);
  const { data, error } = await sb.from('pain_reports').update({ reviewed_by: me.id, reviewed_at: new Date().toISOString(), ...(text ? { coach_response: text } : {}) })
    .eq('id', id).select('client_id').single();
  if (error || !data) return 'Couldn’t save. Try again.';
  if (text) {
    const { error: e2 } = await sb.from('messages').insert({ org_id: me.orgId, client_id: data.client_id, sender_id: me.id, sender_kind: 'coach', body: text, read_by_coach_at: new Date().toISOString() });
    if (e2) return 'Marked as seen, but the message didn’t send.';
  }
  revalidatePath('/coach');
  return null;
}
