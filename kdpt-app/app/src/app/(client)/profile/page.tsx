'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI, type SheetName } from '@/components/client/shell';
import { freqInfo } from '@/components/client/sheets';
import { Chev, Eyebrow, Li, SubTop, Switch } from '@/components/client/ui';
import { CONSENTS } from '@/lib/client/sample-data';
import { resetStore, setState, useClient } from '@/lib/client/store';
import { signOut } from '@/app/actions';

export default function Profile() {
  const s = useClient(), { openSheet, toast, me } = useUI();
  const [delAsk, setDelAsk] = useState(false);
  const f = freqInfo(s.onb.freq), c = s.onb.consent;
  const Row = ({ icon, col, t, d, sheet, onClick }: { icon: string; col: string; t: string; d?: string; sheet?: SheetName; onClick?: () => void }) => (
    <button className="optrow" onClick={onClick ?? (() => sheet && openSheet(sheet))}><Li icon={icon} color={col} /><span className="t"><b>{t}</b>{d && <small>{d}</small>}</span><Chev /></button>
  );
  const previews = [['offline', 'wifi', 'var(--amber)', 'No signal', 'Banner in the gym when the Wi-Fi drops'], ['payFail', 'card', 'var(--coral)', 'Payment failed', 'Alert on Home and in the payment sheet'],
    ['fresh', 'clock', 'var(--sky)', 'Brand-new client', 'Empty History and Progress, before the first workout']] as const;
  return (
    <div className="page fade">
      <SubTop title="You" back="/home" />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="avatar" style={{ width: 64, height: 64, fontSize: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#2c3a31,#1a201c)', color: 'var(--mint)', fontFamily: 'var(--display)', fontWeight: 700 }}>{me.initials}</span>
        <span><b style={{ font: '800 22px var(--display)', display: 'block' }}>{me.name}</b><small style={{ color: 'var(--fg3)' }}>Client since {me.isNew ? 'today' : 'September 2026'}</small></span></div>
      <div><Eyebrow>Coaching</Eyebrow><div className="group">
        <Row icon="card" col="var(--amber)" t="8 PT sessions a month" d="£260 · paid automatically on the 1st" sheet="pay" />
        <Row icon="cal" col="var(--sky)" t={`${s.sessionsLeft} of 8 sessions left in October`} d="24-hour cancellation policy" sheet="book" />
        <Row icon="clip" col="var(--violet)" t="Check-ins" d={`${f.label}${s.onb.freq === 'monthly' ? '' : ' · ' + s.onb.day}`} onClick={() => toast('Change how often you check in')} />
      </div></div>
      <div><Eyebrow>App</Eyebrow><div className="group">
        <div className="optrow"><Li icon="info" color="var(--fg)" /><span className="t"><b>Text size</b></span>
          <span className="tsize">{[1, 1.12, 1.25].map((z, i) => <button key={z} aria-pressed={s.scale === z} style={{ fontSize: 13 + i * 4 }} aria-label={`Text size ${i + 1}`} onClick={() => setState({ scale: z })}>A</button>)}</span></div>
        <Row icon="bell" col="var(--amber)" t="Notifications" d="Choose what reaches your phone" sheet="notifset" />
      </div></div>
      <div><Eyebrow>Privacy and data</Eyebrow><div className="group">
        {CONSENTS.filter(x => !x[3]).map(([k, t, d]) => (
          <div className="cons" style={{ padding: '12px 14px' }} key={k}><span className="t"><b>{t}</b><small>{d}</small></span>
            <Switch on={!!c[k]} label={t} onChange={() => setState({ onb: { ...s.onb, consent: { ...c, [k]: !c[k] } } })} /></div>
        ))}
        <Row icon="clip" col="var(--sky)" t="Health questions" d="Update your answers or injuries" onClick={() => toast('Opens your health questions')} />
        <Row icon="down" col="var(--sky)" t="Download my data" d="Everything we hold about you, by email" onClick={() => toast('We\'ll email you a copy within 24 hours')} />
        <Row icon="trash" col="var(--coral)" t="Delete my account" d="Removes your data. Kyle is told." onClick={() => setDelAsk(!delAsk)} />
      </div></div>
      {delAsk && (
        <div className="explain" style={{ border: '1px solid rgba(255,107,94,.35)', display: 'grid', gap: 12 }}>
          <span><b style={{ color: 'var(--fg)' }}>Delete your account?</b><br />Your workouts, check-ins, food logs and photos are deleted within 30 days. Payment records are kept for 6 years because the law requires it. Your subscription is cancelled at the end of the month.</span>
          <button className="pill-btn" style={{ background: 'var(--coral)', color: '#2a0703' }} onClick={() => toast('Account scheduled for deletion. Kyle has been told')}>Delete my account</button>
          <button className="pill-btn dark" onClick={() => setDelAsk(false)}>Keep my account</button></div>
      )}
      {me.demo && (
        <div><Eyebrow>Demo only · preview states</Eyebrow><div className="group">
          {previews.map(([k, i, col, t, d]) => (
            <div className="cons" style={{ padding: '12px 14px' }} key={k}><Li icon={i} color={col} /><span className="t"><b>{t}</b><small>{d}</small></span>
              <Switch on={s.preview[k]} label={t} onChange={() => setState({ preview: { ...s.preview, [k]: !s.preview[k] }, ...(k === 'payFail' ? { paid: false } : {}) })} /></div>
          ))}
          <button className="optrow" onClick={() => { resetStore(me.id, me.isNew); toast('Demo reset'); }}><Li icon="swap" color="var(--fg2)" /><span className="t"><b>Reset the demo</b><small>Clears everything you&apos;ve logged on this device</small></span></button>
        </div></div>
      )}
      <form action={signOut}><button className="pill-btn dark" style={{ width: '100%' }}>{me.demo ? 'Switch person' : 'Log out'}</button></form>
    </div>
  );
}
