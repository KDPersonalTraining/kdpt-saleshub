'use server';

import { getMe } from '@/lib/auth/session';
import { cleanAnswers, type CheckInQuestion } from '@/lib/checkins/questions';
import { defaultForm } from '@/lib/client/load-live';
import { currentRound, type Frequency } from '@/lib/programmes/plan';
import { createClient } from '@/lib/supabase/server';

// A client sends this round's check-in. The round and questions are worked out
// here, not trusted from the phone.
export async function submitCheckIn(answers: Record<string, unknown>): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'client' || !me.orgId) return 'Only clients send check-ins.';
  const sb = await createClient();
  const form = await defaultForm(sb, me.orgId);
  if (!form) return 'Check-ins aren’t set up yet. Tell Kyle.';
  const { data: d } = await sb.from('client_details').select('check_in_frequency, check_in_weekday, started_on').eq('client_id', me.id).maybeSingle();
  const round = currentRound((d?.check_in_frequency ?? 'weekly') as Frequency, d?.check_in_weekday ?? 7, d?.started_on ?? null, new Date());
  const { data: row } = await sb.from('check_ins').select('questions, submitted_at').eq('client_id', me.id).eq('form_id', form.id).eq('due_on', round).maybeSingle();
  if (row?.submitted_at) return 'This check-in was already sent.';
  const questions = (row?.questions as CheckInQuestion[] | null) ?? form.questions;
  const c = cleanAnswers(questions, answers);
  if (!c.ok) return c.error;
  const { error } = await sb.from('check_ins').upsert({
    org_id: me.orgId, client_id: me.id, form_id: form.id, due_on: round, questions, answers: c.answers, submitted_at: new Date().toISOString(),
  }, { onConflict: 'client_id,form_id,due_on' });
  return error ? 'Couldn’t send it. Check your signal and try again.' : null;
}
