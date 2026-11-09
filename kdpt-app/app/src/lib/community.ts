'use client';

import { browserClient } from '@/lib/supabase/browser';

// Posts, comments and likes, as both apps read them. Row-level security
// decides what each person can see (clients don't see hidden posts).
export type CPost = { id: string; kind: string; title: string | null; body: string; pinned: boolean; at: string; hidden: boolean; likes: number; liked: boolean;
  comments: { id: string; author: string; mine: boolean; body: string; at: string; hidden: boolean }[] };
export const KINDS: Record<string, string> = { announcement: 'News', tip: 'Tip', recipe: 'Meal', question: 'Question of the week', challenge: 'Challenge', weekly_drop: 'This week' };

export async function loadFeed(me: string): Promise<CPost[]> {
  const sb = browserClient(); if (!sb) return [];
  const [{ data: posts }, { data: names }] = await Promise.all([
    sb.from('posts').select('id, kind, title, body, pinned, publish_at, hidden_at, post_reactions(profile_id), post_comments(id, author_id, body, created_at, hidden_at)').order('pinned', { ascending: false }).order('publish_at', { ascending: false }).limit(50),
    sb.rpc('community_names'),
  ]);
  const name = (id: string) => ((names ?? []) as { id: string; name: string }[]).find(n => n.id === id)?.name ?? 'A member';
  type P = { id: string; kind: string; title: string | null; body: string; pinned: boolean; publish_at: string; hidden_at: string | null; post_reactions: { profile_id: string }[];
    post_comments: { id: string; author_id: string; body: string; created_at: string; hidden_at: string | null }[] };
  return ((posts ?? []) as unknown as P[]).map(p => ({
    id: p.id, kind: p.kind, title: p.title, body: p.body, pinned: p.pinned, at: p.publish_at, hidden: !!p.hidden_at,
    likes: p.post_reactions.length, liked: p.post_reactions.some(r => r.profile_id === me),
    comments: [...p.post_comments].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(c => ({ id: c.id, author: name(c.author_id), mine: c.author_id === me, body: c.body, at: c.created_at, hidden: !!c.hidden_at })),
  }));
}

export async function toggleLike(post: string, me: string, org: string, liked: boolean) {
  const sb = browserClient(); if (!sb) return;
  if (liked) await sb.from('post_reactions').delete().eq('post_id', post).eq('profile_id', me);
  else await sb.from('post_reactions').insert({ post_id: post, profile_id: me, org_id: org, reaction: 'like' });
}

export async function addComment(post: string, me: string, org: string, body: string): Promise<boolean> {
  const sb = browserClient(); if (!sb) return false;
  const text = body.trim().slice(0, 2000); if (!text) return false;
  const { error } = await sb.from('post_comments').insert({ post_id: post, author_id: me, org_id: org, body: text });
  return !error;
}
