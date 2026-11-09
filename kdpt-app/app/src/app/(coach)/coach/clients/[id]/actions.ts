'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

async function coach() {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return null;
  return { me, sb: await createClient() };
}
const done = (id: string) => { revalidatePath(`/coach/clients/${id}`); revalidatePath('/coach/clients'); return null; };
const TYPES = ['in_person', 'hybrid', 'online'];

// Private notes, only Kyle sees them.
export async function addNote(clientId: string, body: string): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const text = body.trim().slice(0, 4000); if (!text) return 'Write something first.';
  const { error } = await c.sb.from('coach_notes').insert({ org_id: c.me.orgId, client_id: clientId, author_id: c.me.id, body: text });
  return error ? 'Couldn’t save. Try again.' : done(clientId);
}
export async function updateNote(clientId: string, id: string, patch: { pinned?: boolean; remove?: boolean }): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const { error } = patch.remove ? await c.sb.from('coach_notes').delete().eq('id', id) : await c.sb.from('coach_notes').update({ pinned: !!patch.pinned }).eq('id', id);
  return error ? 'Couldn’t save. Try again.' : done(clientId);
}

export type Details = { fullName: string; preferredName: string; phone: string; coachingType: string; goals: string; restrictions: string };
export async function updateDetails(clientId: string, d: Details): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const name = d.fullName.trim().slice(0, 80); if (!name) return 'Add their name.';
  if (!TYPES.includes(d.coachingType)) return 'Choose in-person, hybrid or online.';
  const phone = d.phone.trim().slice(0, 30);
  if (phone && !/^[+\d\s()-]{6,}$/.test(phone)) return 'That phone number doesn’t look right.';
  const { error: e1 } = await c.sb.from('profiles').update({ full_name: name, preferred_name: d.preferredName.trim().slice(0, 40) || null, phone: phone || null }).eq('id', clientId);
  const { error: e2 } = await c.sb.from('client_details').update({ coaching_type: d.coachingType, goals: d.goals.trim().slice(0, 1000) || null, restrictions: d.restrictions.trim().slice(0, 1000) || null }).eq('client_id', clientId);
  return e1 || e2 ? 'Couldn’t save everything. Try again.' : done(clientId);
}

// Archived clients can't sign in and drop off every list. Nothing is deleted.
export async function setArchived(clientId: string, archived: boolean): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const { error } = await c.sb.from('profiles').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', clientId).eq('role', 'client');
  return error ? 'Couldn’t save. Try again.' : done(clientId);
}

export type Nutrition = { mode: 'full' | 'protein' | 'simple'; kcal: number | null; protein: number | null; carbs: number | null; fat: number | null; notes: string };
export async function saveNutrition(clientId: string, n: Nutrition): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  if (!['full', 'protein', 'simple'].includes(n.mode)) return 'Choose what they see.';
  const ok = (v: number | null, max: number) => v === null || (Number.isInteger(v) && v > 0 && v <= max);
  if (!ok(n.kcal, 8000) || !ok(n.protein, 500) || !ok(n.carbs, 1000) || !ok(n.fat, 400)) return 'Targets must be whole numbers in a sensible range.';
  if (n.mode === 'full' && !n.kcal) return 'Set a calorie target, or choose protein only or no numbers.';
  if (n.mode !== 'simple' && !n.protein) return 'Set a protein target.';
  const { error } = await c.sb.from('nutrition_settings').upsert({ client_id: clientId, org_id: c.me.orgId, mode: n.mode, show_numbers: n.mode !== 'simple',
    kcal_target: n.kcal, protein_g_target: n.protein, carbs_g_target: n.carbs, fat_g_target: n.fat, notes: n.notes.trim().slice(0, 1000) || null });
  return error ? 'Couldn’t save. Try again.' : done(clientId);
}
