'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { NotifToggles, freqInfo } from '@/components/client/sheets';
import { AccBars, Eyebrow, MomentumRings, Ring, Switch } from '@/components/client/ui';
import { CONSENTS, FREQ, GOALS, MOMENTUM, PARQ } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

// Onboarding after the first sign-in. Step 0 is the welcome, 1–7 the
// questions, 8 the summary.
const TITLES = ['', 'A few health questions', 'Your privacy', 'What matters most to you?', 'How many days a week can you train?', 'How often should we check in?', 'What should we tell you about?', 'Put KDPT on your home screen'];
const QUESTIONS = 7;
const BUTTON = ['', 'Continue', 'I agree', 'Continue', 'Continue', 'Continue', 'Allow notifications', 'Done, it\'s on my home screen'];

const SHARE = <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2" /></svg>;

export default function Welcome() {
  const s = useClient(), o = s.onb, { toast, me } = useUI(), router = useRouter();
  const [step, setStep] = useState(0);
  const set = (patch: Partial<typeof o>) => setState({ onb: { ...o, ...patch } });
  const next = () => {
    if (step === 2 && !(o.consent.terms && o.consent.health)) { toast('The two required items are needed to coach you'); return; }
    setStep(step + 1);
  };

  if (step === 0) return (
    <div className="onb">
      <div className="onb-photo"><img src="/assets/coaching.jpg" alt="" /></div>
      <div className="onb-body"><img className="onb-mark" src="/kd-mark.png" alt="KD Personal Training" />
        <span className="eyebrow" style={{ color: 'var(--mint)' }}>Invited by Kyle</span>
        <h1>Welcome, {me.first}</h1><p className="lead">Kyle has set up your coaching. A few quick questions and you&apos;re in.</p>
        <button className="pill-btn mint" onClick={next}>Let&apos;s go <Icon name="right" /></button></div>
    </div>
  );

  if (step > QUESTIONS) {
    const g = GOALS.find(x => x[0] === o.goal) ?? GOALS[0];
    return (
      <div className="onb-done fade">
        <svg viewBox="0 0 150 150" width="150" height="150">{MOMENTUM.map((m, i) => <g key={m.k} transform={`translate(${i * 17} ${i * 17})`}><Ring size={150 - 34 * i} stroke={13} pct={0.08} color={m.col} track={m.tr} /></g>)}</svg>
        <div><h1>You&apos;re all set</h1><p className="lead" style={{ marginTop: 8 }}>Your rings fill up as you train, eat well and check in.</p></div>
        <div className="summary"><span className="chip"><Icon name={g[1]} /> {g[3]}</span><span className="chip"><Icon name="train" /> {o.days} days a week</span>
          <span className="chip"><Icon name="clip" /> {freqInfo(o.freq).label}{o.freq === 'monthly' ? '' : ' · ' + o.day}</span></div>
        <button className="pill-btn white" style={{ width: '100%' }} onClick={() => { set({ done: true }); router.replace('/home'); }}>Open my app</button>
      </div>
    );
  }

  const os = o.os;
  return (
    <>
      <div className="onb fade">
        <div className="onb-top"><button className="round" style={{ background: 'var(--s2)' }} onClick={() => setStep(step - 1)} aria-label="Back"><Icon name="back" /></button>
          <div className="onb-prog" style={{ gridTemplateColumns: `repeat(${QUESTIONS},1fr)` }}>{Array.from({ length: QUESTIONS }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div></div>
        <div className="onb-step"><h1>{TITLES[step]}</h1>
          {step === 1 && (<>
            <p className="lead" style={{ marginTop: -10 }}>So Kyle can keep your training safe. Only Kyle sees your answers.</p>
            <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{PARQ.map((q, i) => (
              <div className="yn" key={i}><span>{q}</span><span className="ynb">
                <button aria-pressed={o.parq[i] === true} onClick={() => { const p = [...o.parq]; p[i] = true; set({ parq: p }); }}>Yes</button>
                <button aria-pressed={o.parq[i] === false} onClick={() => { const p = [...o.parq]; p[i] = false; set({ parq: p }); }}>No</button></span></div>
            ))}</div>
            {o.parq.some(Boolean) && <div className="explain" style={{ border: '1px solid rgba(255,180,94,.3)' }}><Icon name="info" /><span>Thanks for telling us. Kyle will talk this through with you before your first session, and may ask you to check with your GP.</span></div>}
            <div><Eyebrow>Injuries or anything else Kyle should know?</Eyebrow><textarea className="words" placeholder="e.g. Left knee gets sore on deep squats" value={o.injuries} onChange={e => set({ injuries: e.target.value })} /></div>
          </>)}
          {step === 2 && (<>
            <p className="lead" style={{ marginTop: -10 }}>Your data stays between you and Kyle. You can change these any time in Settings.</p>
            <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{CONSENTS.map(([k, t, d, req]) => (
              <div className="cons" key={k}><span className="t"><b>{t}{req && <small style={{ color: 'var(--coral)' }}> Required</small>}</b><small>{d}</small></span>
                <Switch on={!!o.consent[k]} label={t} onChange={() => set({ consent: { ...o.consent, [k]: !o.consent[k] } })} /></div>
            ))}</div>
            <button className="switchto" style={{ color: 'var(--fg2)' }} onClick={() => toast('Opens the privacy notice and terms')}>Read the privacy notice and terms</button>
          </>)}
          {step === 3 && <div className="goal-grid">{GOALS.map(([k, i, c, l]) => (
            <button key={k} className="goal" aria-pressed={o.goal === k} onClick={() => set({ goal: k })}><span className="gi" style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, color: c }}><Icon name={i} /></span>{l}</button>
          ))}</div>}
          {step === 4 && (<>
            <div className="days-pick">{[2, 3, 4, 5, 6].map(n => <button key={n} className="num" aria-pressed={o.days === n} onClick={() => set({ days: n })}>{n}</button>)}</div>
            <p className="lead" style={{ color: 'var(--fg3)', fontSize: 14 }}>Kyle builds your programme around this. You can change it any time.</p>
          </>)}
          {step === 5 && (<>
            <p className="lead" style={{ marginTop: -10 }}>Two minutes on how you feel, your week and your wins. The more often you check in, the more accurate your Momentum.</p>
            <div className="freq">{FREQ.map(([k, l, n, , sub]) => (
              <button key={k} className="fopt" aria-pressed={o.freq === k} onClick={() => set({ freq: k })}><span className="t"><b>{l}</b><small>{sub}</small></span><span className="acc"><AccBars n={n} /></span></button>
            ))}</div>
            {o.freq !== 'monthly' && <div><Eyebrow>Which day?</Eyebrow><div className="daychips">{['Fri', 'Sat', 'Sun', 'Mon'].map(d => <button key={d} aria-pressed={o.day === d} onClick={() => set({ day: d })}>{d}</button>)}</div></div>}
            <div className="preview"><MomentumRings size={56} stroke={6} /><span><b>Momentum accuracy: {freqInfo(o.freq).acc}</b>
              <small>{o.freq === 'weekly' ? 'Kyle can adjust your plan week by week' : o.freq === 'fortnightly' ? 'Trends show up within a month' : 'Best if you also log meals and workouts'}</small></span></div>
          </>)}
          {step === 6 && <NotifToggles />}
          {step === 7 && (<>
            <p className="lead" style={{ marginTop: -10 }}>It opens full screen like any other app, and lets Kyle send you notifications.</p>
            <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>{([['ios', 'iPhone'], ['android', 'Android']] as const).map(([k, l]) => <button key={k} className={os === k ? 'on' : ''} onClick={() => set({ os: k })}>{l}</button>)}</div>
            <div className="group" style={{ '--inset': '68px' } as React.CSSProperties}>{(os === 'ios'
              ? [['share', 'Tap the Share button', 'At the bottom of Safari'], ['plus', 'Choose "Add to Home Screen"', 'Scroll down the list if you can\'t see it'], ['home', 'Open KDPT from your home screen', 'Then turn on notifications when asked']]
              : [['more', 'Tap the menu (⋮) in Chrome', 'Top right of the screen'], ['plus', 'Choose "Install app"', 'Or "Add to Home screen"'], ['home', 'Open KDPT from your home screen', 'Then allow notifications when asked']]
            ).map(([i, t, d], n) => (
              <div className="optrow" key={t}><span className="li" style={{ color: 'var(--mint)' }}>{i === 'share' ? SHARE : i === 'more' ? <b style={{ font: '800 18px var(--display)' }}>⋮</b> : <Icon name={i} />}</span><span className="t"><b>{n + 1}. {t}</b><small>{d}</small></span></div>
            ))}</div>
          </>)}
        </div>
      </div>
      <div className="dock"><button className="pill-btn white" onClick={next}>{BUTTON[step]}</button></div>
    </>
  );
}
