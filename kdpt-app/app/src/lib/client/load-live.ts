import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_QUESTIONS, type CheckInQuestion } from '@/lib/checkins/questions';
import { currentRound, isoDay, lastResults, nextWorkout, roundAfter, weekOf, workoutsForWeek, type Frequency, type SetRow } from '@/lib/programmes/plan';
import { createAdminClient } from '@/lib/supabase/admin';
import { setWords } from './format';
import { buildProgress } from './progress';
import { alternativesFor } from '@/lib/programmes/edit';
import type { LiveCheckIn, LiveData, LivePlan, PlanExercise, PlanWorkout, SessionSummary } from './live';

type Kit = PlanExercise['kit'];
const KIT: Record<string, Kit> = { barbell: 'barbell', smith: 'barbell', dumbbell: 'dumbbell', kettlebell: 'dumbbell', bodyweight: 'body', band: 'body' };

type ExRow = { id: string; slug: string; name: string; load_type: string; load_increment_kg: number; setup_minutes: number; cues: string[]; measure?: string };
type WeRow = { id: string; position: number; working_sets: number; rep_min: number; rep_max: number; rest_seconds: number; priority: PlanExercise['priority']; coach_note: string | null; exercises: ExRow | null };
type WoRow = { id: string; name: string; focus: string | null; phase: string | null; day_order: number; week_from: number | null; week_to: number | null; workout_exercises: WeRow[] };
type LogRow = SetRow & { distance_m: number | null; duration_s: number | null; exercises: { name: string } | null };

// Everything the client app shows from the database, for one client.
export async function loadLive(sb: SupabaseClient, me: { id: string; orgId: string }, today = new Date()): Promise<LiveData> {
  const [{ data: prog }, { data: sess }, { data: logs }, { data: libRows }] = await Promise.all([
    sb.from('programmes').select('id, name, weeks, starts_on').eq('client_id', me.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('workout_sessions').select('id, workout_id, workout_name, started_at, completed_at, status').eq('client_id', me.id).order('started_at', { ascending: false }).limit(40),
    sb.from('set_logs').select('exercise_id, session_id, set_number, load_kg, reps, distance_m, duration_s, completed_at, exercises(name)').eq('client_id', me.id).eq('deleted', false).order('completed_at', { ascending: false }).limit(1500),
    sb.from('exercises').select('id, name, movement_pattern, measure, primary_muscles, load_type').is('archived_at', null).order('name'),
  ]);
  // Kyle's library, for swaps: same movement, same way of logging.
  const library = (libRows ?? []).map(e => ({ id: e.id, name: e.name, pattern: e.movement_pattern, measure: (e.measure === 'distance' ? 'distance' : 'reps') as 'reps' | 'distance', muscles: e.primary_muscles ?? [], kit: KIT[e.load_type] ?? 'machine' }));
  const last = lastResults((logs ?? []) as unknown as SetRow[]);

  const ICON: Record<Kit, string> = { machine: 'machine', dumbbell: 'weight', barbell: 'weight', body: 'body' };
  const swapsFor = (id: string) => {
    const self = library.find(x => x.id === id);
    const alts = self ? alternativesFor(self, library) : [];
    return { alts: alts.map(a => [a.name, a.measure === 'distance' ? 'Same kind of cardio' : 'Same movement', ICON[a.kit]] as [string, string, string]), altIds: Object.fromEntries(alts.map(a => [a.name, a.id])) };
  };

  let plan: LivePlan | null = null;
  if (prog) {
    const { data: wos } = await sb.from('workouts')
      .select('id, name, focus, phase, day_order, week_from, week_to, workout_exercises(id, position, working_sets, rep_min, rep_max, rest_seconds, priority, coach_note, exercises(id, slug, name, load_type, load_increment_kg, setup_minutes, cues, measure))')
      .eq('programme_id', prog.id).order('day_order');
    const workouts: PlanWorkout[] = ((wos ?? []) as unknown as WoRow[]).map(w => ({
      id: w.id, name: w.name, focus: w.focus, phase: w.phase, order: w.day_order, weekFrom: w.week_from, weekTo: w.week_to,
      exercises: [...w.workout_exercises].sort((a, b) => a.position - b.position).filter(we => we.exercises).map(we => {
        const e = we.exercises!, l = last[e.id];
        const cardio = e.measure === 'distance';
        const inc = e.load_type === 'bodyweight' || cardio ? 0 : Number(e.load_increment_kg);
        return {
          id: we.id, lib: e.slug, name: e.name, sets: we.working_sets, reps: [we.rep_min, we.rep_max] as [number, number], rest: we.rest_seconds,
          inc, priority: we.priority, setup: Number(e.setup_minutes), kit: KIT[e.load_type] ?? 'machine',
          last: l && !cardio ? { load: inc === 0 ? 0 : l.load, reps: l.reps } : { load: 0, reps: [] }, measure: cardio ? 'distance' as const : 'reps' as const,
          ...swapsFor(e.id),
          exerciseId: e.id, cues: e.cues ?? [], note: we.coach_note, best: l?.best ?? 0,
        };
      }),
    }));
    const week = weekOf(prog.starts_on, prog.weeks, today);
    const thisWeek = workoutsForWeek(workouts, week);
    const ids = new Set(workouts.map(w => w.id));
    const done = (sess ?? []).filter(x => x.status === 'completed' && x.workout_id && ids.has(x.workout_id));
    const weekStart = prog.starts_on ? isoDay(Date.parse(prog.starts_on) + (week - 1) * 7 * 86400000) : '0000';
    plan = {
      id: prog.id, name: prog.name, weeks: prog.weeks, startsOn: prog.starts_on, week, workouts,
      thisWeek: thisWeek.map(w => w.id), nextId: nextWorkout(thisWeek, done[0]?.workout_id ?? null)?.id ?? null,
      doneThisWeek: done.filter(x => x.started_at.slice(0, 10) >= weekStart).map(x => x.workout_id!),
    };
  }

  // Finished sessions, newest first, with what was lifted.
  const names = new Map<string, string>();
  if (plan) for (const w of plan.workouts) names.set(w.id, w.name);
  const sessions: SessionSummary[] = (sess ?? []).filter(x => x.status === 'completed').slice(0, 20).map(x => {
    const rows = ((logs ?? []) as unknown as LogRow[]).filter(r => r.session_id === x.id).sort((a, b) => a.set_number - b.set_number);
    const by = new Map<string, string[]>();
    for (const r of rows) { const n = r.exercises?.name ?? 'Exercise'; by.set(n, [...(by.get(n) ?? []), setWords(r)]); }
    return {
      id: x.id, workout: (x.workout_id && names.get(x.workout_id)) || x.workout_name || 'Workout', startedAt: x.started_at,
      minutes: x.completed_at ? Math.max(1, Math.round((Date.parse(x.completed_at) - Date.parse(x.started_at)) / 60000)) : null,
      volume: Math.round(rows.reduce((t, r) => t + Number(r.load_kg ?? 0) * (r.reps ?? 0), 0)), distance: Math.round(rows.reduce((t, r) => t + Number(r.distance_m ?? 0), 0)), sets: [...by.entries()],
    };
  });

  const progress = buildProgress(((logs ?? []) as unknown as LogRow[]).map(r => ({ exercise_id: r.exercise_id, name: r.exercises?.name ?? 'Exercise', session_id: r.session_id,
    load_kg: r.load_kg, reps: r.reps, distance_m: r.distance_m, completed_at: r.completed_at })), today);
  // Sessions with Kyle: everything from a fortnight ago onwards.
  const [{ data: bks }, { data: locs }, { data: reqs }, { data: nut }, { data: wts }] = await Promise.all([
    sb.from('bookings').select('id, starts_at, ends_at, status, location_id').eq('client_id', me.id).gte('starts_at', new Date(today.getTime() - 14 * 86400000).toISOString()).order('starts_at').limit(60),
    sb.from('locations').select('id, name'),
    sb.from('booking_change_requests').select('booking_id').eq('client_id', me.id).eq('status', 'pending'),
    sb.from('nutrition_settings').select('mode, kcal_target, protein_g_target, carbs_g_target, fat_g_target, notes').eq('client_id', me.id).maybeSingle(),
    sb.from('body_measurements').select('value, measured_on').eq('client_id', me.id).eq('metric', 'bodyweight_kg').order('measured_on').limit(200),
  ]);
  const nutrition = nut ? { mode: (nut.mode ?? 'full') as 'full' | 'protein' | 'simple', kcal: nut.kcal_target, P: nut.protein_g_target, C: nut.carbs_g_target, F: nut.fat_g_target, notes: nut.notes } : null;
  const weights = (wts ?? []).map(w => ({ date: w.measured_on, kg: Number(w.value) }));
  const bookings = (bks ?? []).map(b => ({ id: b.id, start: b.starts_at, end: b.ends_at, status: b.status, location: (locs ?? []).find(l => l.id === b.location_id)?.name ?? '',
    pending: (reqs ?? []).some(r => r.booking_id === b.id) }));
  return { orgId: me.orgId, plan, sessions, progress, bookings, nutrition, weights, checkin: await loadCheckIn(sb, me, today) };
}

// The org's usual check-in questions. Made the first time anyone needs them.
export async function defaultForm(sb: SupabaseClient, orgId: string): Promise<{ id: string; questions: CheckInQuestion[] } | null> {
  const { data } = await sb.from('check_in_forms').select('id, questions').eq('org_id', orgId).eq('is_default', true).maybeSingle();
  if (data) return data as { id: string; questions: CheckInQuestion[] };
  // A client can't create forms, so this one step uses the server-only key.
  const admin = createAdminClient();
  const { data: made } = await admin.from('check_in_forms').insert({ org_id: orgId, name: 'Check-in', questions: DEFAULT_QUESTIONS, is_default: true })
    .select('id, questions').maybeSingle();
  if (made) return made as { id: string; questions: CheckInQuestion[] };
  // Someone else made it a moment ago (only one default per business is allowed).
  const { data: again } = await admin.from('check_in_forms').select('id, questions').eq('org_id', orgId).eq('is_default', true).maybeSingle();
  return (again as { id: string; questions: CheckInQuestion[] } | null) ?? null;
}

async function loadCheckIn(sb: SupabaseClient, me: { id: string; orgId: string }, today: Date): Promise<LiveCheckIn | null> {
  const [{ data: d }, form] = await Promise.all([
    sb.from('client_details').select('check_in_frequency, check_in_weekday, started_on').eq('client_id', me.id).maybeSingle(),
    defaultForm(sb, me.orgId),
  ]);
  if (!form) return null;
  const freq = (d?.check_in_frequency ?? 'weekly') as Frequency, wd = d?.check_in_weekday ?? 7, start = d?.started_on ?? null;
  const round = currentRound(freq, wd, start, today);
  const { data: row } = await sb.from('check_ins').select('questions, submitted_at, coach_reply').eq('client_id', me.id).eq('form_id', form.id).eq('due_on', round).maybeSingle();
  return {
    formId: form.id, round, nextRound: roundAfter(freq, wd, start, round), freq,
    questions: (row?.questions as CheckInQuestion[] | null) ?? form.questions, submittedAt: row?.submitted_at ?? null, reply: row?.coach_reply ?? null,
  };
}
