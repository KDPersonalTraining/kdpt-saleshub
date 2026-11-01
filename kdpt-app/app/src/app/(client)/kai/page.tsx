'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev } from '@/components/client/ui';
import { AI } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';
import { HANDOFF_TEXT, triage } from '@/lib/kai/triage';

// KAI answers from the client's own plan (only with their consent), and hands
// anything about pain, injury, medical matters or plan changes to the coach.
// Every question goes through the same safety check before any AI sees it.
// In demo mode only the suggested questions have answers; the live version
// calls Claude from the server.
export default function Kai() {
  const s = useClient(), { toast } = useUI();
  const [q, setQ] = useState('');
  const consent = !!s.onb.consent.kai;
  // A new client has no programme yet, so nothing to swap.
  const asked = s.ai, rest = Object.keys(AI).filter(k => !asked.includes(k) && !(k === 'swap' && s.preview.fresh));
  const ask = (k: string) => setState({ ai: [...asked, k], handed: s.handed || !!AI[k].handoff });
  const send = () => {
    const text = q.trim(); if (!text) return;
    const r = triage(text);
    const a = r.to === 'urgent' ? HANDOFF_TEXT.urgent : r.to === 'coach' ? HANDOFF_TEXT[r.reason]
      : 'KAI isn\'t connected in this demo, so I can\'t answer typed questions yet. Your coach can see this one.';
    setState({ aiLog: [...s.aiLog, { q: text, a, to: r.to === 'kai' ? 'demo' : r.to }], handed: s.handed || r.to !== 'kai' });
    setQ('');
  };
  const needsPlan = (k: string) => k === 'swap';
  return (
    <>
      <div className="page fade" style={{ paddingBottom: 150 }}>
        <div className="convo-head"><Link className="round" style={{ background: 'var(--s2)', width: 40, height: 40 }} href="/home" aria-label="Back"><Icon name="back" /></Link>
          <span className="orb"><Icon name="spark" /></span><span className="t"><b>KAI</b><small style={{ color: 'var(--violet)' }}>AI assistant · not your coach</small></span>
          <Link className="switchto" style={{ color: 'var(--mint)' }} href="/chat"><span className="kd-av" style={{ width: 30, height: 30, borderWidth: 1 }}><img src="/kd-mark.png" alt="" style={{ width: 18 }} /></span>Kyle</Link></div>
        {!consent && (
          <div className="consentbar"><span>KAI can only give general answers. Let it use your plan and workouts?</span>
            <button className="pill-btn dark" style={{ height: 40 }} onClick={() => { setState({ onb: { ...s.onb, consent: { ...s.onb.consent, kai: true } } }); toast('KAI can now use your plan. Change this in Settings'); }}>Allow</button></div>
        )}
        {!asked.length && !s.aiLog.length && <div className="ai-empty"><span className="orb lg"><Icon name="spark" /></span><h2>Ask me anything</h2><p>Training, food or recovery. Anything medical goes to your coach.</p></div>}
        <div className="ai-thread">
          {asked.map(k => { const x = AI[k], blocked = needsPlan(k) && !consent; return (
            <div key={k}><div className="q">{x.q}</div>
              <div className="a"><span className="who"><span className="orb sm"><Icon name="spark" /></span>KAI</span>
                <p>{blocked ? 'To answer that I\'d need to look at your plan, and you haven\'t allowed that. Tap Allow above, or ask Kyle.' : x.a}</p>
                {!blocked && <span className="src"><Icon name="clip" />{x.src}</span>}
                {x.handoff ? <Link className="handoff" href="/chat"><span className="kd-av"><img src="/kd-mark.png" alt="" /></span><span className="t"><b>Passed to your coach</b><small>Kyle will reply in your messages</small></span><Chev /></Link>
                  : !blocked && x.go && <Link className="go" href={x.go[1]}>{x.go[0]}</Link>}</div></div>
          ); })}
          {s.aiLog.map((m, i) => (
            <div key={i}><div className="q">{m.q}</div>
              <div className="a" style={m.to === 'urgent' ? { borderColor: 'rgba(255,107,94,.5)' } : undefined}><span className="who"><span className="orb sm"><Icon name="spark" /></span>KAI</span><p>{m.a}</p>
                {(m.to === 'coach' || m.to === 'urgent') && <Link className="handoff" href="/chat"><span className="kd-av"><img src="/kd-mark.png" alt="" /></span><span className="t"><b>Passed to your coach</b><small>Kyle will reply in your messages</small></span><Chev /></Link>}</div></div>
          ))}
        </div>
        {rest.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 10 }}>{asked.length ? 'Ask something else' : 'Try asking'}</div>
          <div className="group" style={{ '--inset': '46px' } as React.CSSProperties}>{rest.map(k => (
            <button key={k} className="prompt" onClick={() => ask(k)}><Icon name="spark" /><span>{AI[k].q}</span><Icon name="right" style={{ color: 'var(--fg3)' }} /></button>
          ))}</div></div>}
      </div>
      <div className="dock" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 8 }}>
        <div className="composer ai"><label><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask KAI" aria-label="Ask KAI" maxLength={500} /></label>
          <button className="round" onClick={send} aria-label="Ask"><Icon name="send" /></button></div>
        <p className="disclaimer">KAI is AI, not a medical professional. Kyle can see every conversation.</p>
      </div>
    </>
  );
}
