'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev, Li, MomentumRings } from '@/components/client/ui';
import { WORKOUT } from '@/lib/client/sample-data';
import { useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';

let pushedOnce = false;

export default function Home() {
  const s = useClient(), { openSheet, push, me } = useUI();
  const p = planFor(s.duration);
  const fresh = s.preview.fresh;
  const days: [string, string, React.ReactNode][] = [['M', 'pt', 'PT'], ['T', 'done', <Icon key="c" name="check" />], ['W', 'now', '21'], ['T', 'pt', 'PT'], ['F', '', '23'], ['S', '', '24'], ['S', '', '25']];

  // Shown once per visit, like the real push when November's sessions are proposed.
  useEffect(() => {
    if (pushedOnce || fresh || s.book.done) return;
    pushedOnce = true;
    const t = setTimeout(() => push('Your November sessions are ready', 'Kyle has proposed 8 sessions on your usual days. Tap to review.', 'book'), 2500);
    return () => clearTimeout(t);
  }, [push, fresh, s.book.done]);

  return (
    <div className="page fade">
      <div className="topbar"><img src="/kd-mark.png" alt="KD Personal Training" /><div className="right">
        <Link className="ib" href="/notifications" aria-label="Notifications"><Icon name="bell" />{!s.read && <span className="badge">3</span>}</Link>
        <Link className="kd-av" href="/chat" aria-label="Messages from Kyle"><img src="/kd-mark.png" alt="" /><span className="dot" /></Link>
        <Link className="avatar" href="/profile" aria-label="Profile and settings">{me.initials}</Link></div></div>
      <div className="greet"><div className="eyebrow">Wednesday 21 October</div><h1>Morning, {me.first}</h1></div>

      {s.preview.payFail && !s.paid && (
        <button className="alert" onClick={() => openSheet('pay')}><Li icon="card" color="var(--coral)" /><span className="t"><b>November payment didn&apos;t go through</b><small>Your bank declined £260. Update your card to keep your sessions.</small></span><Chev /></button>
      )}

      <button className="card mom" onClick={() => openSheet('momentum')} aria-label={fresh ? 'Momentum: just started' : 'Momentum: strong. See the breakdown'}>
        <MomentumRings size={96} stroke={9} pcts={fresh ? [0.04, 0.04, 0.04] : undefined} />
        <span className="t"><span className="eyebrow">Momentum</span><span className="word">{fresh ? 'Day one' : 'Strong'}</span>
          <small>{fresh ? 'Your rings fill as you train, eat well and check in.' : '2 of 3 workouts done. Protein nearly there.'}</small></span>
        <Chev />
      </button>

      <Link className="hero" href="/workout" aria-label={`Start ${WORKOUT.name}`}>
        <img src="/assets/gym.jpg" alt="" />
        <span className="tag label-dot" style={{ color: 'var(--mint)' }}>Today</span>
        <div className="in">
          <div><h2>{WORKOUT.name}</h2>
            <div className="meta num"><span><Icon name="clock" /> {p.minutes} min</span><span><Icon name="layers" /> {p.items.length} exercises</span></div></div>
          <span className="play"><Icon name="play" /></span>
        </div>
      </Link>

      <div className="strip">{days.map(([d, c, t], i) => <div key={i} className={c}><i>{t}</i>{d}</div>)}</div>

      <div className="actions">
        <Link className="act" href="/fuel"><i style={{ color: 'var(--amber)' }}><Icon name="fuel" /></i>Log food</Link>
        <button className="act" onClick={() => openSheet('book')}><i style={{ color: 'var(--sky)' }}><Icon name="cal" /></i>Book</button>
        <Link className="act" href="/checkin"><i style={{ color: 'var(--violet)' }}><Icon name="clip" /></i>Check-in</Link>
        <Link className="act" href="/kai"><i style={{ background: 'none' }}><span className="orb" style={{ width: 60, height: 60, boxShadow: 'none' }}><Icon name="spark" /></span></i>Ask KAI</Link>
      </div>

      <button className="card session" onClick={() => openSheet('session')}>
        <span className="datebox"><small>THU</small><b>22</b></span>
        <span className="t"><b>PT with Kyle</b>{s.sessionCancelled ? <span style={{ color: 'var(--coral)' }}>Cancelled</span> : <span><Icon name="clock" /> 7:00 &nbsp; <Icon name="pin" /> Studio</span>}</span>
        <Chev />
      </button>

      <Link className="card note" href="/chat">
        <img className="mark" src="/kd-mark.png" alt="" />
        <span><small>Kyle · {fresh ? 'just now' : 'yesterday'}</small><p>{fresh ? `Welcome ${me.first}! I'll have your programme ready before our first session.` : 'Leg press goes up today. Take the first set steady 💪'}</p></span>
      </Link>
    </div>
  );
}
