'use client';

import { Heart, MessageCircle, Pin, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useUI } from '@/components/client/shell';
import { Empty } from '@/components/client/ui';
import { addComment, KINDS, loadFeed, toggleLike, type CPost } from '@/lib/community';
import { useLive } from '@/lib/client/live';
import { shortDate } from '@/lib/programmes/plan';

const I = { size: 20, strokeWidth: 1.75 } as const;

// Kyle's posts: news, tips, meals and the question of the week. Clients like
// and comment.
export function LiveCommunity() {
  const { me, toast } = useUI(), live = useLive()!;
  const [posts, setPosts] = useState<CPost[] | null>(null), [open, setOpen] = useState<string | null>(null), [text, setText] = useState('');
  const load = useCallback(async () => setPosts(await loadFeed(me.id)), [me.id]);
  useEffect(() => { void load(); }, [load]);
  const like = async (p: CPost) => { setPosts(ps => ps!.map(x => (x.id === p.id ? { ...x, liked: !p.liked, likes: x.likes + (p.liked ? -1 : 1) } : x))); await toggleLike(p.id, me.id, live.orgId, p.liked); };
  const send = async (p: CPost) => { if (await addComment(p.id, me.id, live.orgId, text)) { setText(''); void load(); } else toast('Couldn’t post it. Try again.'); };
  return (
    <div className="ds ds-page fade">
      <div><h1 className="ds-title">Community</h1></div>
      {posts === null ? <p style={{ color: 'var(--fg3)' }}>Loading…</p> : !posts.length ? <Empty icon="community" color="var(--mint)" title="Nothing here yet">Kyle’s tips, meals and news will show up here.</Empty> : (
        <div style={{ display: 'grid', gap: 24 }}>{posts.map(p => (
          <article key={p.id} style={{ display: 'grid', gap: 10, borderBottom: '1px solid rgba(255,255,255,.09)', paddingBottom: 20 }}>
            <div className="ds-eyebrow" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{p.pinned && <Pin size={14} strokeWidth={1.75} />}{KINDS[p.kind] ?? 'Post'} · {shortDate(p.at)}</div>
            {p.title && <h2 className="ds-h2">{p.title}</h2>}
            <p style={{ margin: 0, whiteSpace: 'pre-line', color: 'var(--fg2)', lineHeight: 1.5 }}>{p.body}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => like(p)} aria-pressed={p.liked} style={{ display: 'flex', gap: 6, alignItems: 'center', color: p.liked ? 'var(--coral)' : 'var(--fg2)', minHeight: 44 }}><Heart {...I} fill={p.liked ? 'currentColor' : 'none'} />{p.likes || ''}</button>
              <button onClick={() => setOpen(open === p.id ? null : p.id)} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--fg2)', minHeight: 44 }}><MessageCircle {...I} />{p.comments.length || ''} {p.kind === 'question' ? 'Answer' : 'Comment'}</button>
            </div>
            {open === p.id && <div style={{ display: 'grid', gap: 10 }}>
              {p.comments.map(c => <p key={c.id} style={{ margin: 0, fontSize: 14 }}><b>{c.mine ? 'You' : c.author}</b> <span style={{ color: 'var(--fg2)' }}>{c.body}</span></p>)}
              <div style={{ display: 'flex', gap: 8 }}><input className="ds-input" value={text} maxLength={2000} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(p)} placeholder="Write a comment" aria-label="Comment" />
                <button className="ds-iconbtn" onClick={() => send(p)} aria-label="Post comment" disabled={!text.trim()}><Send {...I} /></button></div>
            </div>}
          </article>
        ))}</div>
      )}
    </div>
  );
}
