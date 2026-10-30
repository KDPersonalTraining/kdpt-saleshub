'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Icon } from '@/components/icon';
import { Avatar, Head } from '@/components/coach/ui';
import { CONVS, THREADS, byId } from '@/lib/coach/sample-data';

export default function MessagesPage() { return <Suspense><Messages /></Suspense>; }

function Messages() {
  const sp = useSearchParams();
  const [conv, setConv] = useState(THREADS[sp.get('c') ?? ''] ? sp.get('c')! : 'priya');
  const [sent, setSent] = useState<[string, string][]>([]);
  const [reply, setReply] = useState('');
  const cur = [...(THREADS[conv] ?? []), ...sent.filter(m => m[0] === conv).map(m => ['me', m[1]] as [string, string])];
  const send = () => { const v = reply.trim(); if (!v) return; setSent([...sent, [conv, v]]); setReply(''); };
  return (
    <>
      <Head title="Messages" />
      <div className="card msgs-wrap">
        <div className="list">{CONVS.map(([id, last, un]) => (
          <button key={id} className={`conv ${conv === id ? 'on' : ''}`} onClick={() => setConv(id)}><Avatar c={byId(id)} /><span><b>{byId(id).name}</b><small>{last}</small></span>{un && <i className="dot" />}</button>
        ))}</div>
        <div className="thread">
          <div className="body">{cur.map(([w, t], i) => w === 'sys'
            ? <div key={i} className="sysnote"><span className="orb"><Icon name="spark" /></span>{t}</div>
            : <div key={i} className={`bub ${w}`}>{t}</div>)}</div>
          <div className="comp">
            <button className="btn violet" onClick={() => setReply(conv === 'priya' ? 'Good luck Sunday! Keep Monday easy: swap to the upper-body day and we\'ll do legs Wednesday.' : 'Thanks for letting me know. Let\'s go through it at your next session.')}><Icon name="spark" className="sm" />KAI draft</button>
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={`Reply to ${byId(conv).name.split(' ')[0]}`} aria-label="Reply" />
            <button className="btn mint" onClick={send} aria-label="Send"><Icon name="send" className="sm" /></button></div>
        </div>
      </div>
    </>
  );
}
