'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { EXERCISES, starterByKey } from '@/lib/programmes/starters';

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

  // The exercises the starter uses, added to (or refreshed in) Kyle's library.
  const used = new Set(starter.workouts.flatMap(w => w.items.map(i => i.slug)));
  const rows = EXERCISES.filter(e => used.has(e.slug)).map(e => ({
    org_id: org, slug: e.slug, name: e.name, movement_pattern: e.pattern, load_type: e.load, primary_muscles: e.muscles,
    load_increment_kg: e.inc, setup_minutes: e.setup, cues: e.cues,
  }));
  const { data: exs, error: e0 } = await sb.from('exercises').upsert(rows, { onConflict: 'org_id,slug' }).select('id, slug');
  if (e0 || !exs) return 'Couldn’t set up the exercises. Try again.';
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
