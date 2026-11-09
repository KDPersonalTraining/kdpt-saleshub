'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { checkProgramme, type EdProgramme } from '@/lib/programmes/edit';
import { createClient } from '@/lib/supabase/server';

// Saves Kyle's changes to one client's programme. Workouts and exercises he
// removed are deleted (the client's logged sets are kept); changed ones are
// updated in place; new ones are added. Returns an error message, or null.
export async function saveProgramme(clientId: string | null, input: EdProgramme): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can change programmes.';
  const sb = await createClient(), org = me.orgId;

  const q = sb.from('programmes').select('id').eq('id', input.id).eq('org_id', org);
  const { data: prog } = await (clientId ? q.eq('client_id', clientId) : q.is('client_id', null)).maybeSingle();
  if (!prog) return 'Programme not found. Reload the page.';
  const { data: lib } = await sb.from('exercises').select('id, measure').eq('org_id', org);
  const c = checkProgramme(input, lib ?? []);
  if (!c.ok) return c.error;
  const p = c.p;

  const { data: oldWos } = await sb.from('workouts').select('id, workout_exercises(id)').eq('programme_id', p.id);
  const old = (oldWos ?? []) as { id: string; workout_exercises: { id: string }[] }[];
  const keepW = new Set(p.workouts.map(w => w.id).filter(Boolean));
  const keepI = new Set(p.workouts.flatMap(w => w.items.map(i => i.id)).filter(Boolean));
  // Ids sent from the page must belong to this programme.
  if ([...keepW].some(id => !old.some(o => o.id === id)) || [...keepI].some(id => !old.some(o => o.workout_exercises.some(x => x.id === id))))
    return 'This programme changed somewhere else. Reload the page and try again.';

  const fail = 'Some changes didn’t save. Reload the page to see what’s there, then try again.';
  const { error: e0 } = await sb.from('programmes').update({ name: p.name, weeks: p.weeks, starts_on: p.startsOn, updated_at: new Date().toISOString() }).eq('id', p.id);
  if (e0) return fail;

  const goneItems = old.flatMap(o => o.workout_exercises.map(x => x.id)).filter(id => !keepI.has(id));
  if (goneItems.length && (await sb.from('workout_exercises').delete().in('id', goneItems)).error) return fail;
  const goneWos = old.map(o => o.id).filter(id => !keepW.has(id));
  if (goneWos.length && (await sb.from('workouts').delete().in('id', goneWos)).error) return fail;

  for (const [i, w] of p.workouts.entries()) {
    const row = { org_id: org, programme_id: p.id, name: w.name, day_order: i + 1, focus: w.focus || null, phase: w.phase || null, week_from: w.weekFrom, week_to: w.weekTo };
    let wid = w.id;
    if (wid) { if ((await sb.from('workouts').update(row).eq('id', wid)).error) return fail; }
    else {
      const { data, error } = await sb.from('workouts').insert(row).select('id').single();
      if (error || !data) return fail;
      wid = data.id;
    }
    for (const [j, it] of w.items.entries()) {
      const r = { org_id: org, workout_id: wid, exercise_id: it.exerciseId, position: j + 1, working_sets: it.sets, rep_min: it.repMin, rep_max: it.repMax,
        rest_seconds: it.rest, priority: it.priority, coach_note: it.note || null, set_plan: it.plan ?? null, start_load_kg: it.startLoad ?? null };
      const { error } = it.id ? await sb.from('workout_exercises').update(r).eq('id', it.id) : await sb.from('workout_exercises').insert(r);
      if (error) return fail;
    }
  }
  if (clientId) { revalidatePath(`/coach/clients/${clientId}`); revalidatePath(`/coach/clients/${clientId}/programme`); }
  else { revalidatePath('/coach/programmes'); revalidatePath(`/coach/programmes/mine/${p.id}`); }
  return null;
}
