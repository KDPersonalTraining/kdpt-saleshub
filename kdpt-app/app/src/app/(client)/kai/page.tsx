'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev } from '@/components/client/ui';
import { AI } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

// KAI answers from the client's own plan and hands anything about pain,
// injury or plan changes to the coach. In demo mode the answers are canned;
// the live version calls the Claude API from the server.
export default function Kai() {
  const s = useClient(), { toast } = useUI();
  const [q, setQ] = useState('');
  const asked = s.ai, rest = Object.keys(AI).filter(k => !asked.includes(k));
  const ask = (k: string) => setState({ ai: [...asked, k], handed: s.handed || !!AI[k].handoff });
  return (
    <>
      <div className="page fade" style={{ paddingBottom: 150 }}>
        <div className="convo-head"><Link className="round" style={{ background: 'var(--s2)', width: 40, height: 40 }} href="/home" aria-label="Back"><Icon name="back" /></Link>
          <span className="orb"><Icon name="spark" /></span><span className="t"><b>KAI</b><small style={{ color: 'var(--violet)' }}>Your AI assistant</small></span>
          <Link className="switchto" style={{ color: 'var(--mint)' }} href="/chat"><span className="kd-av" style={{ width: 30, height: 30, borderWidth: 1 }}><img src="/kd-mark.png" alt="" style={{ width: 18 }} /></span>Coach</Link></div>
        {!asked.length && <div className="ai-empty"><span className="orb lg"><Icon name="spark" /></span><h2>Ask me anything</h2><p>Training, food or recovery. Anything medical goes to your coach.</p></div>}
        <div className="ai-thread">{asked.map(k => { const x = AI[k]; return (
          <div key={k}><div className="q">{x.q}</div>
            <div className="a"><span className="who"><span className="orb sm"><Icon name="spark" /></span>KAI</span><p>{x.a}</p><span className="src"><Icon name="clip" />{x.src}</span>
              {x.handoff ? <Link className="handoff" href="/chat"><span className="kd-av"><img src="/kd-mark.png" alt="" /></span><span className="t"><b>Passed to your coach</b><small>Kyle will reply in your messages</small></span><Chev /></Link>
                : x.go && <Link className="go" href={x.go[1]}>{x.go[0]}</Link>}</div></div>
        ); })}</div>
        {rest.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 10 }}>{asked.length ? 'Ask something else' : 'Try asking'}</div>
          <div className="group" style={{ '--inset': '46px' } as React.CSSProperties}>{rest.map(k => (
            <button key={k} className="prompt" onClick={() => ask(k)}><Icon name="spark" /><span>{AI[k].q}</span><Icon name="right" style={{ color: 'var(--fg3)' }} /></button>
          ))}</div></div>}
      </div>
      <div className="dock" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 8 }}>
        <div className="composer ai"><label><input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask KAI" aria-label="Ask KAI" /></label>
          <button className="round" onClick={() => { if (q.trim()) { toast('KAI answers once it\'s connected. Try a suggested question'); setQ(''); } }} aria-label="Ask"><Icon name="send" /></button></div>
        <p className="disclaimer">KAI is AI, not a medical professional. Your coach can see every conversation.</p>
      </div>
    </>
  );
}
