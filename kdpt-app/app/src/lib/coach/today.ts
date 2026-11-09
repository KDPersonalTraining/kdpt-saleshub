import type { SupabaseClient } from '@supabase/supabase-js';
import { weekOf } from '@/lib/programmes/plan';
import { isoToUk, ukToIso } from '@/lib/time';

const DAY = 86400000;
export type TodayData = {
  pain: { id: string; clientId: string; name: string; area: string; severity: number; action: string; exercise: string | null; at: string }[];
  checkins: { clientId: string; name: string; n: number }[];
  unread: { clientId: string; name: string; n: number; last: string }[];
  noProgramme: { clientId: string; name: string }[];
  quiet: { clientId: string; name: string; days: number | null; programme: string }[];
  ending: { clientId: string; name: string; programme: string; week: number; weeks: number }[];
  sessions: { id: string; clientId: string; name: string; start: string; status: string }[];
  moves: number;
  recent: { id: string; clientId: string; name: string; workout: string; at: string; volume: number; distance: number; sets: number }[];
  counts: { today: number; messages: number; checkins: number };
};

// Everything Kyle's Today page needs, worked out from the database.
export async function loadToday(sb: SupabaseClient, orgId: string, now = new Date()): Promise<TodayData> {
  const [{ data: people }, { data: states }, { data: progs }, { data: sess }, { data: pains }, { data: cis }, { data: msgs }] = await Promise.all([
    sb.from('profiles').select('id, full_name, created_at').eq('org_id', orgId).eq('role', 'client').is('archived_at', null),
    sb.from('client_app_state').select('client_id, state->onb->done'),
    sb.from('programmes').select('client_id, name, weeks, starts_on').eq('status', 'active').not('client_id', 'is', null),
    sb.from('workout_sessions').select('id, client_id, workout_name, started_at, workouts(name), set_logs(load_kg, reps, distance_m, duration_s, deleted)').eq('status', 'completed').order('started_at', { ascending: false }).limit(200),
    sb.from('pain_reports').select('id, client_id, body_area, severity, action_taken, created_at, exercises(name)').is('reviewed_at', null).order('created_at', { ascending: false }),
    sb.from('check_ins').select('client_id').not('submitted_at', 'is', null).is('reviewed_at', null),
    sb.from('messages').select('client_id, created_at').eq('sender_kind', 'client').is('read_by_coach_at', null).order('created_at', { ascending: false }),
  ]);
  const dayStart = Date.parse(ukToIso(isoToUk(now.getTime()).date, '00:00'));
  const [{ data: bks }, { count: moves }] = await Promise.all([
    sb.from('bookings').select('id, client_id, starts_at, status').in('status', ['held', 'confirmed']).gte('starts_at', new Date(dayStart).toISOString()).lt('starts_at', new Date(dayStart + DAY).toISOString()).order('starts_at'),
    sb.from('booking_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const name = (id: string) => (people ?? []).find(p => p.id === id)?.full_name ?? 'Client';
  const clients = people ?? [];
  type S = { id: string; client_id: string; workout_name: string | null; started_at: string; workouts: { name: string } | null; set_logs: { load_kg: number | null; reps: number | null; distance_m: number | null; duration_s: number | null; deleted: boolean }[] };
  const sessions = (sess ?? []) as unknown as S[];
  const lastSession = (id: string) => sessions.find(x => x.client_id === id)?.started_at ?? null;
  const count = (rows: { client_id: string }[] | null) => { const m = new Map<string, number>(); for (const r of rows ?? []) m.set(r.client_id, (m.get(r.client_id) ?? 0) + 1); return m; };

  const signedUp = new Set((states ?? []).filter(s => (s as { done?: boolean }).done).map(s => s.client_id));
  const progOf = (id: string) => (progs ?? []).find(p => p.client_id === id);

  const pain = ((pains ?? []) as unknown as { id: string; client_id: string; body_area: string; severity: number; action_taken: string; created_at: string; exercises: { name: string } | null }[])
    .map(p => ({ id: p.id, clientId: p.client_id, name: name(p.client_id), area: p.body_area, severity: p.severity, action: p.action_taken, exercise: p.exercises?.name ?? null, at: p.created_at }));
  const checkins = [...count(cis).entries()].map(([clientId, n]) => ({ clientId, name: name(clientId), n }));
  const unreadMap = count(msgs);
  const unread = [...unreadMap.entries()].map(([clientId, n]) => ({ clientId, name: name(clientId), n, last: (msgs ?? []).find(m => m.client_id === clientId)!.created_at }));
  const noProgramme = clients.filter(c => signedUp.has(c.id) && !progOf(c.id)).map(c => ({ clientId: c.id, name: c.full_name }));
  const quiet = clients.flatMap(c => {
    const p = progOf(c.id); if (!p) return [];
    const started = p.starts_on ? Date.parse(p.starts_on) : Date.parse(c.created_at);
    const last = lastSession(c.id), since = last ? Date.parse(last) : started;
    const days = Math.floor((now.getTime() - since) / DAY);
    return days >= 7 && now.getTime() - started >= 7 * DAY ? [{ clientId: c.id, name: c.full_name, days: last ? days : null, programme: p.name }] : [];
  });
  const ending = clients.flatMap(c => {
    const p = progOf(c.id); if (!p?.weeks) return [];
    const week = weekOf(p.starts_on, p.weeks, now);
    return week >= p.weeks ? [{ clientId: c.id, name: c.full_name, programme: p.name, week, weeks: p.weeks }] : [];
  });
  const recent = sessions.slice(0, 12).map(x => {
    const logs = x.set_logs.filter(l => !l.deleted);
    return { id: x.id, clientId: x.client_id, name: name(x.client_id), workout: x.workouts?.name ?? x.workout_name ?? 'Workout', at: x.started_at,
      volume: Math.round(logs.reduce((t, l) => t + Number(l.load_kg ?? 0) * (l.reps ?? 0), 0)), distance: Math.round(logs.reduce((t, l) => t + Number(l.distance_m ?? 0), 0)), sets: logs.length };
  });
  return {
    pain, checkins, unread, noProgramme, quiet, ending, recent, moves: moves ?? 0,
    sessions: (bks ?? []).map(b => ({ id: b.id, clientId: b.client_id, name: name(b.client_id), start: b.starts_at, status: b.status })),
    counts: { today: pain.length + noProgramme.length + quiet.length + ending.length, messages: unread.length, checkins: (cis ?? []).length },
  };
}

// Just the numbers for the menu, on every coach page.
export async function coachCounts(sb: SupabaseClient): Promise<TodayData['counts']> {
  const [{ count: pain }, { data: msgs }, { count: cis }] = await Promise.all([
    sb.from('pain_reports').select('id', { count: 'exact', head: true }).is('reviewed_at', null),
    sb.from('messages').select('client_id').eq('sender_kind', 'client').is('read_by_coach_at', null),
    sb.from('check_ins').select('id', { count: 'exact', head: true }).not('submitted_at', 'is', null).is('reviewed_at', null),
  ]);
  return { today: pain ?? 0, messages: new Set((msgs ?? []).map(m => m.client_id)).size, checkins: cis ?? 0 };
}
