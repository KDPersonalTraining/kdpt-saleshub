import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DemoProfile } from './demo-profile';
import { LiveProfile } from './live-profile';
import { shortDate, weekOf } from '@/lib/programmes/plan';
import type { CoachSession } from './training';
import { setWords } from '@/lib/client/format';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo()) return <DemoProfile id={id} />;
  await requireArea('coach');
  const supabase = await createClient();
  const [{ data: p }, { data: d }, { data: st }, { data: onb }, { data: cons }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, created_at').eq('id', id).eq('role', 'client').maybeSingle(),
    supabase.from('client_details').select('coaching_type, started_on').eq('client_id', id).maybeSingle(),
    supabase.from('client_app_state').select('state, updated_at').eq('client_id', id).maybeSingle(),
    supabase.from('onboarding_responses').select('answers, submitted_at').eq('client_id', id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('current_consents').select('kind, granted').eq('client_id', id),
  ]);
  if (!p) notFound();
  const [{ data: prog }, { data: sess }] = await Promise.all([
    supabase.from('programmes').select('name, weeks, starts_on').eq('client_id', id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('id, workout_name, started_at, completed_at, session_rpe, client_note, workouts(name), set_logs(set_number, load_kg, reps, distance_m, duration_s, deleted, exercises(name))')
      .eq('client_id', id).eq('status', 'completed').order('started_at', { ascending: false }).limit(10),
  ]);
  type Row = { id: string; workout_name: string | null; started_at: string; completed_at: string | null; session_rpe: number | null; client_note: string | null; workouts: { name: string } | null;
    set_logs: { set_number: number; load_kg: number | null; reps: number | null; distance_m: number | null; duration_s: number | null; deleted: boolean; exercises: { name: string } | null }[] };
  const sessions: CoachSession[] = ((sess ?? []) as unknown as Row[]).map(x => {
    const by = new Map<string, string[]>();
    const live = x.set_logs.filter(l => !l.deleted).sort((a, b) => a.set_number - b.set_number);
    for (const l of live) { const n = l.exercises?.name ?? 'Exercise'; by.set(n, [...(by.get(n) ?? []), setWords(l)]); }
    return { id: x.id, workout: x.workouts?.name ?? x.workout_name ?? 'Workout', date: shortDate(x.started_at),
      minutes: x.completed_at ? Math.max(1, Math.round((Date.parse(x.completed_at) - Date.parse(x.started_at)) / 60000)) : null, rpe: x.session_rpe, note: x.client_note, sets: [...by.entries()],
      volume: Math.round(live.reduce((t, l) => t + Number(l.load_kg ?? 0) * (l.reps ?? 0), 0)), distance: Math.round(live.reduce((t, l) => t + Number(l.distance_m ?? 0), 0)) };
  });
  const programme = prog ? { name: prog.name, weeks: prog.weeks, startsOn: prog.starts_on, week: weekOf(prog.starts_on, prog.weeks, new Date()) } : null;
  return <LiveProfile id={id} programme={programme} sessions={sessions} name={p.full_name} added={p.created_at} type={d?.coaching_type ?? null} lastActive={st?.updated_at ?? null}
    state={(st?.state ?? null) as Record<string, unknown> | null} answers={(onb?.answers ?? null) as Record<string, unknown> | null} submitted={onb?.submitted_at ?? null}
    consents={(cons ?? []) as { kind: string; granted: boolean }[]} />;
}
