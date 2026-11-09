import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import type { Answer, CheckInQuestion } from '@/lib/checkins/questions';
import { defaultForm } from '@/lib/client/load-live';
import { currentRound, roundAfter, type Frequency } from '@/lib/programmes/plan';
import { createClient } from '@/lib/supabase/server';
import { DemoCheckins } from './demo-checkins';
import { LiveCheckins, type ClientRound, type Received } from './live-checkins';

export default async function CheckinsPage() {
  if (isDemo()) return <DemoCheckins />;
  const me = await requireArea('coach');
  const sb = await createClient();
  const form = await defaultForm(sb, me.orgId!);
  const [{ data: people }, { data: details }, { data: rows }] = await Promise.all([
    sb.from('profiles').select('id, full_name').eq('org_id', me.orgId!).eq('role', 'client').is('archived_at', null).order('full_name'),
    sb.from('client_details').select('client_id, check_in_frequency, check_in_weekday, started_on'),
    sb.from('check_ins').select('id, client_id, due_on, questions, answers, submitted_at, reviewed_at, coach_reply').order('due_on', { ascending: false }).limit(300),
  ]);
  const usual = (form?.questions ?? []) as CheckInQuestion[];
  const nameOf = (id: string) => (people ?? []).find(p => p.id === id)?.full_name ?? 'Client';
  const today = new Date();

  const clients: ClientRound[] = (people ?? []).map(p => {
    const d = (details ?? []).find(x => x.client_id === p.id);
    const freq = (d?.check_in_frequency ?? 'weekly') as Frequency, wd = d?.check_in_weekday ?? 7, start = d?.started_on ?? null;
    let round = currentRound(freq, wd, start, today);
    const sent = (rows ?? []).find(r => r.client_id === p.id && r.due_on === round && r.submitted_at);
    if (sent) round = roundAfter(freq, wd, start, round);
    const row = (rows ?? []).find(r => r.client_id === p.id && r.due_on === round);
    return { id: p.id, name: p.full_name, freq, weekday: freq === 'monthly' ? null : wd, round, custom: (row?.questions as CheckInQuestion[] | null) ?? null };
  });

  const received: Received[] = (rows ?? []).filter(r => r.submitted_at).slice(0, 60).map(r => ({
    id: r.id, clientId: r.client_id, name: nameOf(r.client_id), due: r.due_on, submittedAt: r.submitted_at!, reviewed: !!r.reviewed_at, reply: r.coach_reply,
    questions: ((r.questions as CheckInQuestion[] | null) ?? usual), answers: (r.answers ?? {}) as Record<string, Answer>,
  }));
  return <LiveCheckins usual={usual} clients={clients} received={received} />;
}
