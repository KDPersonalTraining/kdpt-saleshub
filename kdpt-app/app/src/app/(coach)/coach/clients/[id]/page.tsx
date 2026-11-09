import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DemoProfile } from './demo-profile';
import { LiveProfile } from './live-profile';
import { shortDate, weekOf } from '@/lib/programmes/plan';
import type { CoachSession } from './training';
import { setWords } from '@/lib/client/format';
import type { Extras } from './record-extras';
import type { Nutrition } from './actions';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo()) return <DemoProfile id={id} />;
  await requireArea('coach');
  const supabase = await createClient();
  const [{ data: p }, { data: d }, { data: st }, { data: onb }, { data: cons }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, preferred_name, phone, archived_at, created_at').eq('id', id).eq('role', 'client').maybeSingle(),
    supabase.from('client_details').select('coaching_type, started_on, goals, restrictions').eq('client_id', id).maybeSingle(),
    supabase.from('client_app_state').select('state, updated_at').eq('client_id', id).maybeSingle(),
    supabase.from('onboarding_responses').select('answers, submitted_at').eq('client_id', id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('current_consents').select('kind, granted').eq('client_id', id),
  ]);
  if (!p) notFound();
  const [{ data: prog }, { data: sess }, { data: notes }, { data: nut }, { data: bks }, { data: locs }, { data: wts }] = await Promise.all([
    supabase.from('programmes').select('name, weeks, starts_on').eq('client_id', id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('id, workout_name, started_at, completed_at, session_rpe, client_note, workouts(name), set_logs(set_number, load_kg, reps, distance_m, duration_s, deleted, exercises(name))')
      .eq('client_id', id).eq('status', 'completed').order('started_at', { ascending: false }).limit(10),
    supabase.from('coach_notes').select('id, body, pinned, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('nutrition_settings').select('mode, kcal_target, protein_g_target, carbs_g_target, fat_g_target, notes').eq('client_id', id).maybeSingle(),
    supabase.from('bookings').select('id, starts_at, status, location_id').eq('client_id', id).in('status', ['held', 'confirmed']).gte('starts_at', new Date().toISOString()).order('starts_at').limit(6),
    supabase.from('locations').select('id, name'),
    supabase.from('body_measurements').select('value, measured_on').eq('client_id', id).eq('metric', 'bodyweight_kg').order('measured_on').limit(200),
  ]);
  const extras: Extras = {
    details: { fullName: p.full_name, preferredName: p.preferred_name ?? '', phone: p.phone ?? '', coachingType: d?.coaching_type ?? 'in_person', goals: d?.goals ?? '', restrictions: d?.restrictions ?? '', archived: !!p.archived_at },
    notes: (notes ?? []).map(n => ({ id: n.id, body: n.body, pinned: n.pinned, at: n.created_at })),
    nutrition: nut ? { mode: (nut.mode ?? 'full') as Nutrition['mode'], kcal: nut.kcal_target, protein: nut.protein_g_target, carbs: nut.carbs_g_target, fat: nut.fat_g_target, notes: nut.notes ?? '' } : null,
    sessions: (bks ?? []).map(b => ({ id: b.id, start: b.starts_at, status: b.status, location: (locs ?? []).find(l => l.id === b.location_id)?.name ?? '' })),
    weights: (wts ?? []).map(w => ({ date: w.measured_on, kg: Number(w.value) })),
    log: ((st?.state as { log?: Record<string, unknown[]> } | null)?.log) ?? null,
  };
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
  return <LiveProfile extras={extras} id={id} programme={programme} sessions={sessions} name={p.full_name} added={p.created_at} type={d?.coaching_type ?? null} lastActive={st?.updated_at ?? null}
    state={(st?.state ?? null) as Record<string, unknown> | null} answers={(onb?.answers ?? null) as Record<string, unknown> | null} submitted={onb?.submitted_at ?? null}
    consents={(cons ?? []) as { kind: string; granted: boolean }[]} />;
}
