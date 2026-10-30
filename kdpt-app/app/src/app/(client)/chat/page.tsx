'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { Chev } from '@/components/client/ui';
import { setState, useClient } from '@/lib/client/store';

export default function Chat() {
  const s = useClient(), fresh = s.preview.fresh;
  const [msg, setMsg] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [s.chat.length]);
  const send = () => { const v = msg.trim(); if (!v) return; setState({ chat: [...s.chat, v] }); setMsg(''); };
  return (
    <>
      <div className="page fade" style={{ paddingBottom: 110 }}>
        <div className="convo-head"><Link className="round" style={{ background: 'var(--s2)', width: 40, height: 40 }} href="/home" aria-label="Back"><Icon name="back" /></Link>
          <span className="kd-av" style={{ width: 44, height: 44 }}><img src="/kd-mark.png" alt="" /><span className="dot" /></span>
          <span className="t"><b>Kyle</b><small style={{ color: 'var(--mint)' }}>Your coach · replies within a few hours</small></span></div>
        <Link className="handoff" style={{ background: 'rgba(169,155,255,.07)', borderColor: 'rgba(169,155,255,.22)' }} href="/kai"><span className="orb sm"><Icon name="spark" /></span><span className="t"><b>Need an answer now?</b><small>Ask KAI, your AI assistant</small></span><Chev /></Link>
        <div className="msgs">
          {fresh ? (<><div className="stamp">Today</div><div className="msg them">Welcome to KDPT! Message me here any time. I&apos;ll go through your health answers before our first session.</div></>) : (<>
            <div className="stamp">Yesterday</div>
            <div className="msg them">Great session Monday. Leg press goes up today 💪</div>
            <div className="msg me">Thanks! Knee felt a bit tight on the lunges though</div>
            <div className="msg them">Noted. Keep the lunges short-stride and tell me if it&apos;s worse.</div>
          </>)}
          {s.handed && <><div className="sysnote"><span className="orb sm"><Icon name="spark" /></span>KAI passed this to your coach</div>
            <div className="msg me"><div className="quote">My knee aches during lunges</div>Asked KAI about this. Can you take a look?</div></>}
          {s.chat.map((m, i) => <div className="msg me" key={i}>{m}</div>)}
          <div ref={end} />
        </div>
      </div>
      <div className="dock" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 10 }}>
        <div className="composer"><label><input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message Kyle" aria-label="Message Kyle" /></label>
          <button className="round" onClick={send} aria-label="Send"><Icon name="send" /></button></div>
      </div>
    </>
  );
}
