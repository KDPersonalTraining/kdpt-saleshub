'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Sec, Tag } from '@/components/coach/ui';
import { KINDS, loadFeed, type CPost } from '@/lib/community';
import { shortDate } from '@/lib/programmes/plan';
import { createPost, moderate } from './actions';

const field = { background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: '8px 10px', color: 'var(--fg)', font: 'inherit', fontSize: 14, width: '100%' } as const;

// Kyle posts to every client and looks after the comments.
export function LiveCommunity({ me }: { me: string }) {
  const toast = useToast();
  const [posts, setPosts] = useState<CPost[]>([]);
  const [v, setV] = useState({ kind: 'tip', title: '', body: '', pinned: false }), [busy, setBusy] = useState(false);
  const load = useCallback(async () => setPosts(await loadFeed(me)), [me]);
  useEffect(() => { void load(); }, [load]);
  const act = async (a: Parameters<typeof moderate>[0], msg: string) => { const e = await moderate(a); toast(e ?? msg); void load(); };
  return (
    <>
      <Head title="Community" sub="Everything you post here goes to every client. They can like and comment." />
      <div className="card pad" style={{ display: 'grid', gap: 10 }}>
        <div className="fields"><label>Kind<select value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })}>{['tip', 'recipe', 'question', 'announcement', 'challenge'].map(k => <option key={k} value={k}>{KINDS[k]}</option>)}</select></label>
          <label>Title (optional)<input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} /></label></div>
        <textarea style={field} rows={4} value={v.body} onChange={e => setV({ ...v, body: e.target.value })} placeholder={v.kind === 'question' ? 'e.g. What’s one thing that made training easier this week?' : 'Write your post'} aria-label="Post" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={v.pinned} onChange={e => setV({ ...v, pinned: e.target.checked })} />Pin to the top</label>
          <button className="btn mint" disabled={busy || !v.body.trim()} onClick={async () => { setBusy(true); const e = await createPost(v); setBusy(false); if (e) toast(e); else { setV({ kind: v.kind, title: '', body: '', pinned: false }); toast('Posted'); void load(); } }}><Icon name="send" className="sm" />Post</button></div>
      </div>
      <section><Sec title="Posts" right={`${posts.length}`} />
        <div style={{ display: 'grid', gap: 12 }}>{posts.map(p => (
          <div key={p.id} className="card pad" style={{ display: 'grid', gap: 8, opacity: p.hidden ? 0.5 : 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><Tag c="grey">{KINDS[p.kind] ?? p.kind}</Tag>{p.pinned && <Tag c="amber">Pinned</Tag>}{p.hidden && <Tag c="coral">Hidden from clients</Tag>}<span className="muted" style={{ fontSize: 12 }}>{shortDate(p.at)} · {p.likes} like{p.likes === 1 ? '' : 's'}</span></div>
            {p.title && <b>{p.title}</b>}<p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 14 }}>{p.body}</p>
            {p.comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, opacity: c.hidden ? 0.5 : 1, borderTop: '1px solid var(--hair)', paddingTop: 6 }}>
                <span style={{ flex: 1 }}><b>{c.author}</b> {c.body}</span>
                <button className="btn line" style={{ height: 28 }} onClick={() => act({ table: 'post_comments', id: c.id, action: c.hidden ? 'show' : 'hide' }, c.hidden ? 'Comment shown' : 'Comment hidden')}>{c.hidden ? 'Show' : 'Hide'}</button></div>
            ))}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn line" onClick={() => act({ table: 'posts', id: p.id, action: p.pinned ? 'unpin' : 'pin' }, p.pinned ? 'Unpinned' : 'Pinned')}>{p.pinned ? 'Unpin' : 'Pin'}</button>
              <button className="btn line" onClick={() => act({ table: 'posts', id: p.id, action: p.hidden ? 'show' : 'hide' }, p.hidden ? 'Shown to clients' : 'Hidden from clients')}>{p.hidden ? 'Show' : 'Hide'}</button>
              <button className="btn line" style={{ color: 'var(--coral)' }} onClick={() => { if (confirm('Delete this post and its comments?')) void act({ table: 'posts', id: p.id, action: 'delete' }, 'Deleted'); }}>Delete</button></div>
          </div>
        ))}{!posts.length && <div className="card"><p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>No posts yet. Try a tip, a meal or a question of the week.</p></div>}</div>
      </section>
    </>
  );
}
