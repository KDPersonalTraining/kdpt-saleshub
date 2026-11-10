'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev } from '@/components/client/ui';
import { askKai, setKaiConsent } from '@/app/(client)/kai/actions';
import { useLive } from '@/lib/client/live';
import { setState, useClient } from '@/lib/client/store';

const STARTERS = ['What’s my next workout?', 'How do I know if a weight is too heavy?', 'What should I eat before a morning session?', 'How can I sleep better for recovery?'];

// KAI with real answers from Claude. The safety check runs on the server
// before anything reaches the AI; handoffs go straight to Kyle's messages.
export function LiveKai() {
  const s = useClient(), live = useLive()!, { toast } = useUI(), router = useRouter();
  const [q, setQ] = useState(''), [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [s.aiLog.length, busy]);
  const log = s.aiLog.filter(m => m.to !== 'demo' || m.a);
  const send = async (text = q.trim()) => {
    if (!text || busy) return;
    setQ(''); setBusy(true);
    const history = s.aiLog.filter(m => m.to === 'kai').slice(-6).map(({ q: hq, a }) => ({ q: hq, a }));
    setState({ aiLog: [...s.aiLog, { q: text, a: '', to: 'kai' }] });
    const r = await askKai(text, history);
    setBusy(false);
    setState(st => ({ aiLog: [...st.aiLog.slice(0, -1), { q: text, a: r.answer, to: r.to === 'off' ? 'demo' : r.to }], handed: st.handed || r.to === 'coach' || r.to === 'urgent' }));
  };
  const allow = async () => { const e = await setKaiConsent(true); if (e) toast(e); else { toast('KAI can now use your plan. Change this in Settings'); router.refresh(); } };
  return (
    <>
      <div className="page fade" style={{ paddingBottom: 150 }}>
        <div className="convo-head"><Link className="round" style={{ background: 'var(--s2)', width: 40, height: 40 }} href="/home" aria-label="Back"><Icon name="back" /></Link>
          <span className="orb"><Icon name="spark" /></span><span className="t"><b>KAI</b><small style={{ color: 'var(--violet)' }}>AI assistant · not your coach</small></span>
          <Link className="switchto" style={{ color: 'var(--mint)' }} href="/chat"><span className="kd-av" style={{ width: 30, height: 30, borderWidth: 1 }}><img src="/kd-mark.png" alt="" style={{ width: 18 }} /></span>Kyle</Link></div>
        {!live.kaiConsent && <div className="consentbar"><span>KAI can only give general answers. Let it use your plan and workouts? (Never your health answers.)</span>
          <button className="pill-btn dark" style={{ height: 40 }} onClick={allow}>Allow</button></div>}
        {!log.length && <div className="ai-empty"><span className="orb lg"><Icon name="spark" /></span><h2>Ask me anything</h2><p>Training, food or recovery. Anything about pain or health goes to Kyle.</p></div>}
        <div className="ai-thread">{log.map((m, i) => (
          <div key={i}><div className="q">{m.q}</div>
            <div className="a" style={m.to === 'urgent' ? { borderColor: 'rgba(255,107,94,.5)' } : undefined}><span className="who"><span className="orb sm"><Icon name="spark" /></span>KAI</span>
              <KaiText text={m.a || 'Thinking…'} />
              {(m.to === 'coach' || m.to === 'urgent') && <Link className="handoff" href="/chat"><span className="kd-av"><img src="/kd-mark.png" alt="" /></span><span className="t"><b>Passed to Kyle</b><small>He’ll reply in your messages</small></span><Chev /></Link>}</div></div>
        ))}<div ref={end} /></div>
        {!busy && log.length < 2 && <div><div className="eyebrow" style={{ marginBottom: 10 }}>Try asking</div>
          <div className="group" style={{ '--inset': '46px' } as React.CSSProperties}>{STARTERS.map(t => (
            <button key={t} className="prompt" onClick={() => send(t)}><Icon name="spark" /><span>{t}</span><Icon name="right" style={{ color: 'var(--fg3)' }} /></button>
          ))}</div></div>}
      </div>
      <div className="dock" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 8 }}>
        <div className="composer ai"><label><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={busy ? 'KAI is thinking…' : 'Ask KAI'} aria-label="Ask KAI" maxLength={500} disabled={busy} /></label>
          <button className="round" onClick={() => send()} aria-label="Ask" disabled={busy || !q.trim()}><Icon name="send" /></button></div>
        <p className="disclaimer">KAI is AI, not a medical professional. Kyle can see every conversation.</p>
      </div>
    </>
  );
}

// Short answers: plain lines, with "- " lines shown as a tidy list.
function KaiText({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={out.length} style={{ margin: '4px 0', paddingLeft: 18, display: 'grid', gap: 4 }}>{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; } };
  for (const l of lines) {
    const m = l.match(/^[-•*]\s+(.*)$/);
    if (m) list.push(m[1].replace(/\*\*/g, ''));
    else { flush(); out.push(<p key={out.length} style={{ margin: 0 }}>{l.replace(/\*\*/g, '')}</p>); }
  }
  flush();
  return <div style={{ display: 'grid', gap: 6 }}>{out}</div>;
}
