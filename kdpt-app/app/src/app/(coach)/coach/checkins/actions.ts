'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { cleanQuestions } from '@/lib/checkins/questions';
import { defaultForm } from '@/lib/client/load-live';
import { createClient } from '@/lib/supabase/server';
import { prettyDate } from '@/lib/programmes/plan';

async function coach() {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return null;
  return { me, sb: await createClient() };
}
const done = () => { revalidatePath('/coach/checkins'); return null; };

// The usual questions, used for every round Kyle hasn't changed.
export async function saveUsualQuestions(questions: unknown): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can change check-ins.';
  const q = cleanQuestions(questions); if (!q.ok) return q.error;
  const form = await defaultForm(c.sb, c.me.orgId!); if (!form) return 'Couldn’t find the check-in form.';
  const { error } = await c.sb.from('check_in_forms').update({ questions: q.questions }).eq('id', form.id);
  return error ? 'Couldn’t save. Try again.' : done();
}

// One client's questions for one round. Null puts the usual ones back.
export async function saveRoundQuestions(clientId: string, round: string, questions: unknown | null): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can change check-ins.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(round)) return 'That date isn’t valid.';
  const form = await defaultForm(c.sb, c.me.orgId!); if (!form) return 'Couldn’t find the check-in form.';
  const { data: row } = await c.sb.from('check_ins').select('id, submitted_at').eq('client_id', clientId).eq('form_id', form.id).eq('due_on', round).maybeSingle();
  if (row?.submitted_at) return 'They’ve already sent this one.';
  let qs = null;
  if (questions !== null) { const q = cleanQuestions(questions); if (!q.ok) return q.error; qs = q.questions; }
  const { error } = await c.sb.from('check_ins').upsert({ org_id: c.me.orgId, client_id: clientId, form_id: form.id, due_on: round, questions: qs }, { onConflict: 'client_id,form_id,due_on' });
  return error ? 'Couldn’t save. Try again.' : done();
}

// How often a client checks in, and on which day (ISO, Monday 1).
export async function setSchedule(clientId: string, freq: string, weekday: number | null): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can change check-ins.';
  if (!['weekly', 'fortnightly', 'monthly'].includes(freq)) return 'Choose how often.';
  const wd = freq === 'monthly' ? null : weekday && weekday >= 1 && weekday <= 7 ? weekday : 7;
  const { error } = await c.sb.from('client_details').update({ check_in_frequency: freq, check_in_weekday: wd }).eq('client_id', clientId);
  return error ? 'Couldn’t save. Try again.' : done();
}

// Kyle reads a check-in, and optionally replies. A reply also goes to the
// client's messages, so they see it either way.
export async function reviewCheckIn(id: string, reply: string): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can reply.';
  const text = reply.trim().slice(0, 4000);
  const { data: ci, error } = await c.sb.from('check_ins').update({ reviewed_by: c.me.id, reviewed_at: new Date().toISOString(), ...(text ? { coach_reply: text } : {}) })
    .eq('id', id).select('client_id, due_on').single();
  if (error || !ci) return 'Couldn’t save. Try again.';
  if (text) {
    const { error: e2 } = await c.sb.from('messages').insert({ org_id: c.me.orgId, client_id: ci.client_id, sender_id: c.me.id, sender_kind: 'coach', body: `About your check-in (${prettyDate(ci.due_on)}):\n${text}`, read_by_coach_at: new Date().toISOString() });
    if (e2) return 'Reply saved on the check-in, but the message didn’t send.';
  }
  return done();
}
