'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { freqInfo } from '@/components/client/sheets';
import { Ring } from '@/components/client/ui';
import { FREQ, GOALS, MOMENTUM, PARQ } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

// Sign-up after the first sign-in. One thing per screen, as few words as
// possible. Health questions must each be answered; the terms must be agreed.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const Q = PARQ.length;
// 0 welcome · 1..Q health · Q+1 notes · Q+2 agree · Q+3 goal · Q+4 days · Q+5 check-ins · Q+6 notifications · Q+7 home screen · Q+8 done
const LAST = Q + 7;

export default function Welcome() {
  const s = useClient(), o = s.onb, { me } = useUI(), router = useRouter();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const set = (patch: Partial<typeof o>) => setState({ onb: { ...o, ...patch } });
  const next = () => setStep(step + 1);

  if (step === 0) return (
    <div className="onb">
      <div className="onb-photo"><img src="/assets/coaching.jpg" alt="" /></div>
      <div className="onb-body"><img className="onb-mark" src="/kd-mark.png" alt="KD Personal Training" />
        <h1>Welcome, {me.first}</h1><p className="lead">Two minutes and you&apos;re in.</p>
        <button className="pill-btn mint" onClick={next}>Start <Icon name="right" /></button></div>
    </div>
  );

  if (step > LAST) {
    const g = GOALS.find(x => x[0] === o.goal) ?? GOALS[0];
    return (
      <div className="onb-done fade">
        <svg viewBox="0 0 150 150" width="150" height="150">{MOMENTUM.map((m, i) => <g key={m.k} transform={`translate(${i * 17} ${i * 17})`}><Ring size={150 - 34 * i} stroke={13} pct={0.08} color={m.col} track={m.tr} /></g>)}</svg>
        <h1>You&apos;re all set</h1>
        <div className="summary"><span className="chip"><Icon name={g[1]} /> {g[3]}</span><span className="chip"><Icon name="train" /> {o.days} days</span>
          <span className="chip"><Icon name="clip" /> {freqInfo(o.freq).label}{o.freq === 'monthly' ? '' : ' · ' + o.day}</span></div>
        <button className="pill-btn white" style={{ width: '100%' }} onClick={() => { set({ done: true }); router.replace('/home'); }}>Open my app</button>
      </div>
    );
  }

  const health = step >= 1 && step <= Q, qi = step - 1;
  const anyYes = o.parq.some(Boolean);
  // The bottom button: hidden where a tap on an option moves on by itself.
  const dock: [string, boolean] | null =
    step === Q + 1 ? [o.injuries.trim() ? 'Continue' : 'Nothing to add', true]
    : step === Q + 2 ? ['Agree and continue', agreed]
    : step === Q + 5 ? ['Continue', true]
    : step === Q + 7 ? ['Done', true]
    : null;

  return (
    <>
      <div className="onb fade">
        <div className="onb-top"><button className="round" style={{ background: 'var(--s2)' }} onClick={() => setStep(step - 1)} aria-label="Back"><Icon name="back" /></button>
          <div className="onb-prog" style={{ gridTemplateColumns: `repeat(${LAST},1fr)` }}>{Array.from({ length: LAST }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div></div>

        {health && (
          <div className="onb-step q1">
            <div className="eyebrow">Health · {qi + 1} of {Q}</div>
            <h1>{PARQ[qi]}</h1>
            <div className="yn2">{([[true, 'Yes'], [false, 'No']] as const).map(([v, l]) => (
              <button key={l} aria-pressed={o.parq[qi] === v} onClick={() => { const p = [...o.parq]; p[qi] = v; set({ parq: p }); next(); }}>{l}</button>
            ))}</div>
          </div>
        )}

        {step === Q + 1 && (
          <div className="onb-step">
            <h1>Any injuries Kyle should know about?</h1>
            {anyYes && <p className="lead">Kyle will go through your answers with you before you start.</p>}
            <textarea className="words" placeholder="e.g. Sore left knee on deep squats" value={o.injuries} onChange={e => set({ injuries: e.target.value })} />
          </div>
        )}

        {step === Q + 2 && (
          <div className="onb-step">
            <h1>Your privacy</h1>
            <p className="lead">Only Kyle sees your health information.</p>
            <button className="agree" aria-pressed={agreed} onClick={() => setAgreed(!agreed)}>
              <span className="box"><Icon name="check" /></span>
              <span>I agree to the <u>terms</u>, the 24-hour cancellation policy, and Kyle storing my health information.</span>
            </button>
            <p className="fine">Photos, KAI and emails are off. Turn them on any time in Settings.</p>
          </div>
        )}

        {step === Q + 3 && (
          <div className="onb-step"><h1>What&apos;s your main goal?</h1>
            <div className="goal-grid">{GOALS.map(([k, i, c, l]) => (
              <button key={k} className="goal" aria-pressed={o.goal === k} onClick={() => { set({ goal: k }); next(); }}><span className="gi" style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, color: c }}><Icon name={i} /></span>{l}</button>
            ))}</div></div>
        )}

        {step === Q + 4 && (
          <div className="onb-step"><h1>Days a week you can train</h1>
            <div className="days-pick">{[2, 3, 4, 5, 6].map(n => <button key={n} className="num" aria-pressed={o.days === n} onClick={() => { set({ days: n }); next(); }}>{n}</button>)}</div></div>
        )}

        {step === Q + 5 && (
          <div className="onb-step"><h1>How often should you check in?</h1>
            <div className="seg" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>{FREQ.map(([k, l]) => <button key={k} className={o.freq === k ? 'on' : ''} onClick={() => set({ freq: k })}>{l}</button>)}</div>
            {o.freq !== 'monthly' && <div className="days7pick">{DAYS.map(d => <button key={d} aria-pressed={o.day === d} onClick={() => set({ day: d })}>{d.slice(0, 1)}<small>{d}</small></button>)}</div>}
            <p className="fine">{o.freq === 'monthly' ? 'On the 1st of each month.' : `Every ${o.freq === 'weekly' ? '' : 'other '}${o.day === 'Sun' ? 'Sunday' : o.day === 'Sat' ? 'Saturday' : o.day + 'day'}. More often means a more accurate Momentum.`}</p>
          </div>
        )}

        {step === Q + 6 && (
          <div className="onb-step center">
            <span className="bigicon" style={{ color: 'var(--amber)' }}><Icon name="bell" /></span>
            <h1>Stay in the loop</h1>
            <p className="lead">Session reminders, check-ins and messages from Kyle.</p>
            <div style={{ display: 'grid', gap: 10, width: '100%' }}>
              <button className="pill-btn white" onClick={next}>Allow notifications</button>
              <button className="pill-btn dark" onClick={() => { setState({ notifs: Object.fromEntries(Object.keys(s.notifs).map(k => [k, false])) }); next(); }}>Not now</button></div>
          </div>
        )}

        {step === Q + 7 && (
          <div className="onb-step"><h1>Add KDPT to your home screen</h1>
            <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>{([['ios', 'iPhone'], ['android', 'Android']] as const).map(([k, l]) => <button key={k} className={o.os === k ? 'on' : ''} onClick={() => set({ os: k })}>{l}</button>)}</div>
            <ol className="steps">{(o.os === 'ios' ? ['Tap Share in Safari', 'Add to Home Screen', 'Open KDPT from there'] : ['Tap ⋮ in Chrome', 'Install app', 'Open KDPT from there']).map(t => <li key={t}>{t}</li>)}</ol>
          </div>
        )}
      </div>
      {dock && <div className="dock"><button className="pill-btn white" disabled={!dock[1]} style={dock[1] ? undefined : { opacity: .4 }}
        onClick={() => { if (step === Q + 2) set({ consent: { ...o.consent, terms: true, health: true } }); next(); }}>{dock[0]}</button></div>}
    </>
  );
}
