'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

const KINDS = ['announcement', 'tip', 'recipe', 'question', 'challenge'];
async function coach() {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return null;
  return { me, sb: await createClient() };
}

export async function createPost(v: { kind: string; title: string; body: string; pinned: boolean }): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can post.';
  if (!KINDS.includes(v.kind)) return 'Choose what kind of post it is.';
  const body = v.body.trim().slice(0, 5000); if (!body) return 'Write something first.';
  if (v.pinned) await c.sb.from('posts').update({ pinned: false }).eq('org_id', c.me.orgId).eq('pinned', true);
  const { error } = await c.sb.from('posts').insert({ org_id: c.me.orgId, author_id: c.me.id, kind: v.kind, title: v.title.trim().slice(0, 120) || null, body, pinned: v.pinned });
  revalidatePath('/coach/community');
  return error ? 'Couldn’t post it. Try again.' : null;
}

// Hide or show a post or comment for clients, pin a post, or delete a post.
export async function moderate(v: { table: 'posts' | 'post_comments'; id: string; action: 'hide' | 'show' | 'pin' | 'unpin' | 'delete' }): Promise<string | null> {
  const c = await coach(); if (!c) return 'Only the coach can do this.';
  const q = c.sb.from(v.table);
  const { error } = v.action === 'delete' ? await q.delete().eq('id', v.id)
    : v.action === 'pin' || v.action === 'unpin' ? await c.sb.from('posts').update({ pinned: v.action === 'pin' }).eq('id', v.id)
    : await q.update({ hidden_at: v.action === 'hide' ? new Date().toISOString() : null, ...(v.table === 'posts' ? { hidden_by: v.action === 'hide' ? c.me.id : null } : {}) }).eq('id', v.id);
  revalidatePath('/coach/community');
  return error ? 'Couldn’t save. Try again.' : null;
}
