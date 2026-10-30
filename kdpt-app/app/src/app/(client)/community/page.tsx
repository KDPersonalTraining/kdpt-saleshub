'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev, Li } from '@/components/client/ui';
import { CATS, COMMUNITY_LIBRARY, FOODS, PEOPLE, POSTS, type Post } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

const Avatar = ({ id, small }: { id: string; small?: boolean }) => id === 'kyle'
  ? <span className="kd-av" style={small ? { width: 28, height: 28 } : undefined}><img src="/kd-mark.png" alt="" /></span>
  : <span className="av" style={{ background: `hsl(${PEOPLE[id][2]} 30% 18%)`, color: `hsl(${PEOPLE[id][2]} 70% 72%)` }}>{PEOPLE[id][1]}</span>;

export default function Community() {
  const [tab, setTab] = useState<'feed' | 'library'>('feed');
  const [cat, setCat] = useState<string | null>(null);
  return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">KDPT group · 35 members</div><h1>Community</h1></div>
      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }} role="tablist">
        {([['feed', 'Feed'], ['library', 'Library']] as const).map(([k, l]) => <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setCat(null); }}>{l}</button>)}
      </div>
      {tab === 'feed' ? (
        <>
          {POSTS.map(p => <PostCard key={p.id} p={p} />)}
        </>
      ) : !cat ? (
        <div className="cats">{CATS.map(([k, l, i, col, sub], n) => (
          <button key={k} className={`cat ${n === 4 ? 'wide' : ''}`} onClick={() => setCat(k)}><Li icon={i} color={col} /><span><b>{l}</b><small>{COMMUNITY_LIBRARY[k].length} · {sub}</small></span></button>
        ))}</div>
      ) : <Category cat={cat} back={() => setCat(null)} />}
    </div>
  );
}

function PostCard({ p }: { p: Post }) {
  const s = useClient(), { toast, me } = useUI();
  const [open, setOpen] = useState(p.id === 'q1');
  const [reply, setReply] = useState('');
  const cat = p.cat ? CATS.find(x => x[0] === p.cat) : undefined;
  const liked = !!s.liked[p.id];
  const mine = s.comments[p.id] ?? [];
  const cmts: [string, string][] = [...p.cmts, ...mine.map(t => ['me', t] as [string, string])];
  const send = () => { const v = reply.trim(); if (!v) return; setState({ comments: { ...s.comments, [p.id]: [...mine, v] } }); setReply(''); };
  return (
    <article className={`post ${p.pinned ? 'pinned' : ''}`}>
      <div className="by"><Avatar id={p.by} /><span className="t"><b>{PEOPLE[p.by][0]}</b>{p.by === 'kyle' && <span className="coachtag">Coach</span>}<small>{p.when}{p.pinned ? ' · Pinned' : ''}</small></span>
        {cat && <span className="label-dot" style={{ color: cat[3] }}>{cat[1]}</span>}</div>
      {p.title && <h3>{p.title}</h3>}<p>{p.body}</p>
      {p.imgs && <div className="strip3">{p.imgs.map(i => <img key={i} src={`/assets/${i}.jpg`} alt="" />)}</div>}
      {p.board && <><div className="board">{p.board.map(([n, v], i) => <div key={n}><span>{i + 1}. {n}</span><b className="num">{v} avg</b></div>)}</div>
        <button className="pill-btn dark" onClick={() => toast('You\'ve joined. Steps count from Sunday')}>Join the challenge</button></>}
      <div className="acts">
        <button className={liked ? 'on' : ''} onClick={() => setState({ liked: { ...s.liked, [p.id]: !liked } })}><Icon name="heart" /><span className="num">{p.likes + (liked ? 1 : 0)}</span></button>
        <button onClick={() => setOpen(!open)}><Icon name="chat" /><span className="num">{cmts.length}</span> {p.cat === 'questions' ? 'Answers' : 'Comments'}</button>
      </div>
      {open && (
        <div className="cmts">
          {cmts.map(([w, t], i) => (
            <div className="cmt" key={i}>{w === 'me'
              ? <span className="av" style={{ background: 'hsl(145 30% 18%)', color: 'hsl(145 70% 72%)' }}>{me.initials}</span> : <Avatar id={w} small />}
              <span><b>{w === 'me' ? me.first : PEOPLE[w][0]}</b>{t}</span></div>
          ))}
          <div className="reply"><input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={p.cat === 'questions' ? 'Add your answer' : 'Write a comment'} aria-label="Reply" />
            <button className="addbtn" style={{ color: 'var(--mint)', background: 'rgba(126,213,151,.1)', boxShadow: 'inset 0 0 0 1px rgba(126,213,151,.45)' }} onClick={send} aria-label="Send"><Icon name="send" /></button></div>
        </div>
      )}
    </article>
  );
}

function Category({ cat, back }: { cat: string; back: () => void }) {
  const s = useClient(), { toast } = useUI();
  const [, l, i, col] = CATS.find(x => x[0] === cat)!;
  return (
    <>
      <button className="switchto" style={{ color: 'var(--fg2)' }} onClick={back}><Icon name="back" size={16} /> All categories</button>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Li icon={i} color={col} /><h2 style={{ fontSize: 22, fontWeight: 800 }}>{l}</h2></div>
      <div className="group" style={{ '--inset': cat === 'meals' ? '66px' : '68px' } as React.CSSProperties}>
        {cat === 'meals' ? COMMUNITY_LIBRARY.meals.map(([img, n, w]) => { const f = FOODS.find(x => x.img === img); return (
          <div className="food" key={n}><img src={`/assets/${img}.jpg`} alt="" /><span className="t"><b>{n}</b><small className="num">{w}{f ? ` · ${f.kcal} kcal · ${f.P}g protein` : ''}</small></span>
            {f && <button className="addbtn" onClick={() => { setState({ log: { ...s.log, Dinner: [...s.log.Dinner, f.id] } }); toast('Added to today\'s dinner in Fuel'); }} aria-label="Add to Fuel"><Icon name="plus" /></button>}</div>
        ); }) : COMMUNITY_LIBRARY[cat].map(r => (
          <button className="optrow" key={r[1]} onClick={() => toast(r[1])}><Li icon={i} color={col} /><span className="t"><b>{r[1]}</b><small>{r[0]}{r[2] ? ' · ' + r[2] : ''}</small></span><Chev /></button>
        ))}
      </div>
    </>
  );
}
