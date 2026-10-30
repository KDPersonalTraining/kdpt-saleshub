'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { freqInfo } from '@/components/client/sheets';
import { Eyebrow, Li } from '@/components/client/ui';
import { MOODS, SUPPORT, WEEK_SCALES, WINS } from '@/lib/client/sample-data';
import { newCheckin, setState, useClient, type CheckIn } from '@/lib/client/store';

const TITLES = ['', 'How are you feeling?', 'How was your week?', 'Wins beyond the scale', 'How can your coach help?'];

export default function CheckinPage() {
  const s = useClient(), router = useRouter(), { toast } = useUI();
  useEffect(() => { if (!s.checkin) setState({ checkin: newCheckin() }); }, [s.checkin]);
  const c = s.checkin;
  if (!c) return null;
  const set = (patch: Partial<CheckIn>) => setState({ checkin: { ...c, ...patch } });

  if (c.step === 5) {
    const wins = WINS.filter(w => c.wins[w[0]]), sup = SUPPORT.filter(x => c.support[x[0]]);
    return (
      <div className="ci-done fade"><span className="orbok"><Icon name="check" /></span>
        <div><h1>Check-in sent</h1><p className="lead" style={{ marginTop: 8 }}>Your coach will reply before your next session. Momentum updated.</p></div>
        <div className="group ci-sum" style={{ '--inset': '62px' } as React.CSSProperties}>
          <div className="optrow"><Li icon="sun" color={MOODS[c.mood][1]} /><span className="t"><b>Feeling {MOODS[c.mood][0].toLowerCase()}</b><small>{c.words ? c.words.slice(0, 60) : 'No note this week'}</small></span></div>
          <div className="optrow"><Li icon="trophy" color="var(--mint)" /><span className="t"><b>{wins.length} win{wins.length === 1 ? '' : 's'} beyond the scale</b><small>{wins.map(w => w[1]).join(' · ') || 'Next week'}</small></span></div>
          <div className="optrow"><Li icon="chat" color="var(--sky)" /><span className="t"><b>Support</b><small>{sup.map(x => x[1]).join(' · ') || 'Nothing extra'}</small></span></div>
        </div>
        <Link className="pill-btn white" style={{ width: '100%' }} href="/home" onClick={() => setState({ checkin: null, checkinsSent: s.checkinsSent + 1 })}>Done</Link></div>
    );
  }

  const mood = MOODS[c.mood];
  return (
    <>
      <div className="onb fade ci-wrap">
        <div className="onb-top">
          <button className="round" style={{ background: 'var(--s2)' }} aria-label={c.step === 1 ? 'Close' : 'Back'}
            onClick={() => (c.step === 1 ? router.push('/home') : set({ step: c.step - 1 }))}><Icon name={c.step === 1 ? 'close' : 'back'} /></button>
          <div className="onb-prog">{[1, 2, 3, 4].map(i => <i key={i} className={i <= c.step ? 'on' : ''} />)}</div></div>
        <div className="onb-step">
          <div><div className="eyebrow" style={{ color: 'var(--violet)' }}>{freqInfo(s.onb.freq).label} check-in</div><h1 style={{ marginTop: 6 }}>{TITLES[c.step]}</h1></div>
          {c.step === 1 && (<>
            <div><div className="mind" style={{ '--c': mood[1] } as React.CSSProperties} /><b className="mindword">{mood[0]}</b></div>
            <div><input type="range" className="moodrange" min={0} max={4} step={1} value={c.mood} aria-label="How you're feeling" onChange={e => set({ mood: +e.target.value })} />
              <div className="moodlabels">{MOODS.map(m => <span key={m[0]}>{m[0]}</span>)}</div></div>
            <div><Eyebrow>In your own words</Eyebrow><textarea className="words" placeholder="What's been going on? Work, family, how training felt…" value={c.words} onChange={e => set({ words: e.target.value })} /></div>
          </>)}
          {c.step === 2 && (<>
            {WEEK_SCALES.map(([k, l, icon, col, lo, hi]) => (
              <div className="cimetric" key={k}><div className="lab"><b style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Li icon={icon} color={col} style={{ width: 32, height: 32, borderRadius: 9 }} />{l}</b><small>{lo} → {hi}</small></div>
                <div className="scale5">{[1, 2, 3, 4, 5].map(v => (
                  <button key={v} className={`num ${v < c.scales[k] ? 'lit' : ''}`} style={{ '--c': col } as React.CSSProperties} aria-pressed={c.scales[k] === v} onClick={() => set({ scales: { ...c.scales, [k]: v } })}>{v}</button>
                ))}</div></div>
            ))}
            <div><Eyebrow>Any aches or niggles?</Eyebrow><div className="daychips">{['None', 'Knee', 'Back', 'Shoulder', 'Hip', 'Other'].map(a => <button key={a} aria-pressed={c.aches === a} onClick={() => set({ aches: a })}>{a}</button>)}</div></div>
          </>)}
          {c.step === 3 && (<>
            <div className="quotecard"><p>Would you rather lose 5 lbs, or look like you&apos;ve lost 5 lbs?</p><small><img src="/kd-mark.png" alt="" />It&apos;s not about the number on the scales</small></div>
            <div><Eyebrow>What&apos;s better this week?</Eyebrow>
              <div className="wins">{WINS.map(([k, l, icon, col]) => (
                <button key={k} className="win" aria-pressed={!!c.wins[k]} onClick={() => set({ wins: { ...c.wins, [k]: !c.wins[k] } })}><span className="wintile" style={{ color: col }}><Icon name={icon} /></span>{l}</button>
              ))}</div></div>
            <div><Eyebrow>Optional</Eyebrow>
              <div className="group" style={{ '--inset': '68px' } as React.CSSProperties}>
                <button className="optrow" onClick={() => { set({ photo: !c.photo }); if (!c.photo) toast('Photo added · private'); }}><Li icon="camera" color="#c9cfcb" /><span className="t"><b>Progress photo</b><small>Private to you and your coach</small></span><span className="add">{c.photo ? 'Added ✓' : 'Add'}</span></button>
                <div><button className="optrow" onClick={() => set({ measure: !c.measure })}><Li icon="weight" color="#c9cfcb" /><span className="t"><b>Measurements or weight</b><small>Only if you want to. Once a month is plenty</small></span><span className="add">{c.measure ? 'Hide' : 'Add'}</span></button>
                  {c.measure && <div className="meas"><label>Waist<input inputMode="decimal" placeholder="– cm" value={c.waist} onChange={e => set({ waist: e.target.value })} /></label>
                    <label>Weight<input inputMode="decimal" placeholder="– kg" value={c.weight} onChange={e => set({ weight: e.target.value })} /></label></div>}</div>
              </div></div>
          </>)}
          {c.step === 4 && (<>
            <div className="group" style={{ '--inset': '64px' } as React.CSSProperties}>{SUPPORT.map(([k, l, icon, col]) => (
              <button key={k} className="sup" aria-pressed={!!c.support[k]} onClick={() => set({ support: { ...c.support, [k]: !c.support[k] } })}><span className="suptile" style={{ color: col }}><Icon name={icon} /></span><span className="t">{l}</span><span className="tick"><Icon name="check" /></span></button>
            ))}</div>
            <div><Eyebrow>Anything else your coach should know?</Eyebrow><textarea className="words" placeholder="Holidays coming up, a new job, a niggle you're unsure about…" value={c.note} onChange={e => set({ note: e.target.value })} /></div>
          </>)}
        </div>
      </div>
      <div className="dock"><button className={`pill-btn ${c.step === 4 ? 'mint' : 'white'}`} onClick={() => set({ step: c.step + 1 })}>{c.step === 4 ? 'Send to your coach' : 'Continue'}</button></div>
    </>
  );
}
