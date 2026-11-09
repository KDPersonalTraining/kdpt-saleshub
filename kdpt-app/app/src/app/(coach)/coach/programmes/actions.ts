'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { starterByKey } from '@/lib/programmes/starters';
import { ensureLibrary } from '@/lib/coach/library';

// Kyle gives a starter programme to a client. The starter is copied into the
// database as that client's own programme (so it can be changed for them
// alone), and any programme they were on is archived, not deleted.
// Returns an error message, or null.
export async function assignStarter(v: { clientId: string; key: string; startsOn: string }): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can give out programmes.';
  const starter = starterByKey(v.key);
  if (!starter) return 'That programme doesn’t exist.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.startsOn)) return 'Choose a start date.';
  const sb = await createClient();
  const org = me.orgId;

  const { data: client } = await sb.from('profiles').select('id').eq('id', v.clientId).eq('role', 'client').eq('org_id', org).maybeSingle();
  if (!client) return 'Client not found.';

  // Kyle's whole library, with every starter exercise in it.
  const exs = await ensureLibrary(sb, org);
  if (!exs) return 'Couldn’t set up the exercises. Try again.';
  const idOf = Object.fromEntries(exs.map(e => [e.slug, e.id]));

  const { data: prog, error: e1 } = await sb.from('programmes').insert({
    org_id: org, client_id: v.clientId, name: starter.name, description: starter.summary, status: 'draft',
    starts_on: v.startsOn, weeks: starter.weeks, created_by: me.id, template_key: starter.key,
  }).select('id').single();
  if (e1 || !prog) return 'Couldn’t create the programme. Try again.';

  const undo = async (msg: string) => { await sb.from('programmes').delete().eq('id', prog.id); return msg; };
  const { data: wos, error: e2 } = await sb.from('workouts').insert(starter.workouts.map((w, i) => ({
    org_id: org, programme_id: prog.id, name: w.name, day_order: i + 1, focus: w.focus, phase: w.phase ?? null,
    week_from: w.weeks?.[0] ?? null, week_to: w.weeks?.[1] ?? null,
  }))).select('id, day_order');
  if (e2 || !wos) return undo('Couldn’t save the workouts. Nothing was changed.');

  const woId = Object.fromEntries(wos.map(w => [w.day_order, w.id]));
  const items = starter.workouts.flatMap((w, i) => w.items.map((it, p) => ({
    org_id: org, workout_id: woId[i + 1], exercise_id: idOf[it.slug], position: p + 1, working_sets: it.sets,
    rep_min: it.reps[0], rep_max: it.reps[1], rest_seconds: it.rest, priority: it.priority, coach_note: it.note ?? null,
  })));
  const { error: e3 } = await sb.from('workout_exercises').insert(items);
  if (e3) return undo('Couldn’t save the exercises. Nothing was changed.');

  // Only now does the client see it: archive the old one, switch this one on.
  await sb.from('programmes').update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('client_id', v.clientId).eq('status', 'active');
  const { error: e4 } = await sb.from('programmes').update({ status: 'active' }).eq('id', prog.id);
  if (e4) return undo('Couldn’t switch the programme on. Nothing was changed.');

  revalidatePath('/coach/programmes');
  revalidatePath(`/coach/clients/${v.clientId}`);
  return null;
}

type Sb = Awaited<ReturnType<typeof createClient>>;
async function coachOnly() {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return null;
  return { me, sb: await createClient() };
}

// Copies a programme in the database (workouts and exercises) as a new one:
// for a client (active, replacing theirs) or as one of Kyle's own (no client).
async function copyProgramme(sb: Sb, me: { id: string; orgId?: string }, srcId: string, to: { clientId: string | null; startsOn: string | null; name?: string }): Promise<{ id: string } | { error: string }> {
  const { data: src } = await sb.from('programmes').select('name, description, weeks, starts_on, template_key, workouts(name, day_order, focus, phase, week_from, week_to, workout_exercises(exercise_id, position, working_sets, rep_min, rep_max, rest_seconds, priority, coach_note))')
    .eq('id', srcId).maybeSingle();
  if (!src) return { error: 'Programme not found.' };
  type W = { name: string; day_order: number; focus: string | null; phase: string | null; week_from: number | null; week_to: number | null; workout_exercises: Record<string, unknown>[] };
  const { data: prog, error } = await sb.from('programmes').insert({ org_id: me.orgId, client_id: to.clientId, name: to.name ?? src.name, description: src.description, status: to.clientId ? 'draft' : 'active',
    starts_on: to.startsOn, weeks: src.weeks, created_by: me.id, template_key: src.template_key }).select('id').single();
  if (error || !prog) return { error: 'Couldn’t copy the programme. Try again.' };
  for (const w of (src.workouts ?? []) as W[]) {
    const { data: nw, error: e1 } = await sb.from('workouts').insert({ org_id: me.orgId, programme_id: prog.id, name: w.name, day_order: w.day_order, focus: w.focus, phase: w.phase, week_from: w.week_from, week_to: w.week_to }).select('id').single();
    if (e1 || !nw) { await sb.from('programmes').delete().eq('id', prog.id); return { error: 'Couldn’t copy the workouts. Nothing was changed.' }; }
    if (w.workout_exercises.length) {
      const { error: e2 } = await sb.from('workout_exercises').insert(w.workout_exercises.map(x => ({ ...x, org_id: me.orgId, workout_id: nw.id })));
      if (e2) { await sb.from('programmes').delete().eq('id', prog.id); return { error: 'Couldn’t copy the exercises. Nothing was changed.' }; }
    }
  }
  if (to.clientId) {
    await sb.from('programmes').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('client_id', to.clientId).eq('status', 'active');
    await sb.from('programmes').update({ status: 'active' }).eq('id', prog.id);
  }
  return { id: prog.id };
}

// Give one of Kyle's own programmes to a client.
export async function assignTemplate(v: { clientId: string; templateId: string; startsOn: string }): Promise<string | null> {
  const c = await coachOnly(); if (!c) return 'Only the coach can give out programmes.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.startsOn)) return 'Choose a start date.';
  const r = await copyProgramme(c.sb, c.me, v.templateId, { clientId: v.clientId, startsOn: v.startsOn });
  if ('error' in r) return r.error;
  revalidatePath('/coach/programmes'); revalidatePath(`/coach/clients/${v.clientId}`);
  return null;
}

// Save a client's programme as one of Kyle's own, to reuse.
export async function saveAsTemplate(programmeId: string, name: string): Promise<{ error: string | null; id?: string }> {
  const c = await coachOnly(); if (!c) return { error: 'Only the coach can do this.' };
  const n = name.trim().slice(0, 80); if (!n) return { error: 'Give it a name.' };
  const r = await copyProgramme(c.sb, c.me, programmeId, { clientId: null, startsOn: null, name: n });
  if ('error' in r) return { error: r.error };
  revalidatePath('/coach/programmes');
  return { error: null, id: r.id };
}

// A new programme of Kyle's own: blank, or a copy of a starter to change.
export async function newTemplate(v: { name: string; fromStarter: string | null }): Promise<{ error: string | null; id?: string }> {
  const c = await coachOnly(); if (!c) return { error: 'Only the coach can do this.' };
  const name = v.name.trim().slice(0, 80); if (!name) return { error: 'Give it a name.' };
  const lib = await ensureLibrary(c.sb, c.me.orgId!); if (!lib) return { error: 'Couldn’t set up the exercise library.' };
  const st = v.fromStarter ? starterByKey(v.fromStarter) : null;
  const { data: prog, error } = await c.sb.from('programmes').insert({ org_id: c.me.orgId, client_id: null, name, status: 'active', weeks: st?.weeks ?? 8, created_by: c.me.id, template_key: st?.key ?? null, description: st?.summary ?? null }).select('id').single();
  if (error || !prog) return { error: 'Couldn’t create it. Try again.' };
  const workouts = st ? st.workouts : [{ name: 'Workout A', focus: '', phase: undefined, weeks: undefined, items: [] }];
  for (const [i, w] of workouts.entries()) {
    const { data: nw } = await c.sb.from('workouts').insert({ org_id: c.me.orgId, programme_id: prog.id, name: w.name, day_order: i + 1, focus: w.focus || null, phase: w.phase ?? null, week_from: w.weeks?.[0] ?? null, week_to: w.weeks?.[1] ?? null }).select('id').single();
    if (nw && w.items.length) await c.sb.from('workout_exercises').insert(w.items.map((it, j) => ({ org_id: c.me.orgId, workout_id: nw.id, exercise_id: lib.find(e => e.slug === it.slug)!.id, position: j + 1,
      working_sets: it.sets, rep_min: it.reps[0], rep_max: it.reps[1], rest_seconds: it.rest, priority: it.priority, coach_note: it.note ?? null })));
  }
  revalidatePath('/coach/programmes');
  return { error: null, id: prog.id };
}

// A client's own programme from scratch: one empty workout to fill in.
export async function blankForClient(clientId: string): Promise<{ error: string | null }> {
  const c = await coachOnly(); if (!c) return { error: 'Only the coach can do this.' };
  const start = new Date().toISOString().slice(0, 10);
  const { data: prog, error } = await c.sb.from('programmes').insert({ org_id: c.me.orgId, client_id: clientId, name: 'New programme', status: 'draft', starts_on: start, weeks: 8, created_by: c.me.id }).select('id').single();
  if (error || !prog) return { error: 'Couldn’t create it. Try again.' };
  await c.sb.from('workouts').insert({ org_id: c.me.orgId, programme_id: prog.id, name: 'Workout A', day_order: 1 });
  await c.sb.from('programmes').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('client_id', clientId).eq('status', 'active');
  await c.sb.from('programmes').update({ status: 'active' }).eq('id', prog.id);
  revalidatePath(`/coach/clients/${clientId}`);
  return { error: null };
}

export async function deleteTemplate(id: string): Promise<string | null> {
  const c = await coachOnly(); if (!c) return 'Only the coach can do this.';
  const { error } = await c.sb.from('programmes').delete().eq('id', id).is('client_id', null);
  revalidatePath('/coach/programmes');
  return error ? 'Couldn’t delete it. Try again.' : null;
}
