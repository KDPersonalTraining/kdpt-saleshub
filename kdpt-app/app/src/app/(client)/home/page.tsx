'use client';

import { Bell, CalendarClock, ChevronRight, ClipboardCheck, CreditCard, Dumbbell, MessageCircle, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUI } from '@/components/client/shell';
import { MomentumRings } from '@/components/client/ui';
import { MOMENTUM, WORKOUT } from '@/lib/client/sample-data';
import { useCurrentWorkout, useLive } from '@/lib/client/live';
import { prettyDate } from '@/lib/programmes/plan';
import { CLIENT_LABEL, isUpcoming, shownState } from '@/lib/bookings/states';
import { ukWhen } from '@/lib/time';
import { useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';

// Home: the next thing to do comes first (today's workout), then the next
// session with Kyle, anything waiting on the client, and quick ways to log.
const I = { size: 20, strokeWidth: 1.75 } as const;
let pushedOnce = false;

export default function Home() {
  const s = useClient(), { openSheet, push, me } = useUI(), router = useRouter();
  const p = planFor(s.duration);
  const fresh = s.preview.fresh;

  // Shown once per visit, like the real push when November's sessions are proposed.
  useEffect(() => {
    if (pushedOnce || fresh || s.book.done) return;
    pushedOnce = true;
    const t = setTimeout(() => push('Your November sessions are ready', 'Kyle has proposed 8 sessions on your usual days. Tap to review.', 'book'), 2500);
    return () => clearTimeout(t);
  }, [push, fresh, s.book.done]);

  if (fresh) return <NewClientHome />;

  const inProgress = s.startedAt != null;
  const todo: { icon: React.ReactNode; title: string; sub: string; tag?: [string, string]; onClick: () => void }[] = [];
  if (s.preview.payFail && !s.paid) todo.push({ icon: <CreditCard {...I} />, title: 'November payment didn’t go through', sub: 'Update your card or try again', tag: ['bad', 'Action needed'], onClick: () => openSheet('pay') });
  if (!s.book.done) todo.push({ icon: <CalendarClock {...I} />, title: 'November sessions to review', sub: '8 proposed by Kyle', tag: ['wait', 'Waiting for you'], onClick: () => openSheet('book') });
  if (!s.checkinsSent) todo.push({ icon: <ClipboardCheck {...I} />, title: 'Weekly check-in', sub: 'Due Sunday · 2 minutes', onClick: () => router.push('/checkin') });

  return (
    <div className="ds ds-page fade">
      <Top me={me.initials} unread={!s.read} />
      <div><div className="ds-eyebrow">Wednesday 21 October</div><h1 className="ds-title">Morning, {me.first}</h1></div>

      <section className="ds-card" aria-label="Today's workout">
        <div><div className="ds-eyebrow" style={{ color: inProgress ? 'var(--amber)' : 'var(--mint)' }}>{inProgress ? 'In progress' : 'Today'}</div>
          <h2 className="ds-h2" style={{ marginTop: 6, fontSize: 24 }}>{WORKOUT.name}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--fg2)', fontSize: 14 }} className="num">{p.items.length} exercises · about {p.minutes} min</p></div>
        <Link className="ds-btn primary" href="/workout"><Dumbbell {...I} />{inProgress ? 'Carry on' : 'Start workout'}</Link>
      </section>

      <section className="ds-section">
        <header><h2 className="ds-h2">Coming up</h2></header>
        <div className="ds-list">
          <button className="ds-row" onClick={() => openSheet('session')}><CalendarClock {...I} />
            <span className="t"><b>PT with Kyle</b><small className="num">Thursday 22 October · 7:00 · Studio</small></span>
            <span className="end">{s.sessionCancelled ? <span className="ds-tag bad">Cancelled</span> : <span className="ds-tag ok">Confirmed</span>}<ChevronRight {...I} /></span></button>
          {todo.map(t => (
            <button key={t.title} className="ds-row" onClick={t.onClick}>{t.icon}
              <span className="t"><b>{t.title}</b><small>{t.sub}</small></span>
              <span className="end">{t.tag && <span className={`ds-tag ${t.tag[0]}`}>{t.tag[1]}</span>}<ChevronRight {...I} /></span></button>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <header><h2 className="ds-h2">This week</h2><button onClick={() => openSheet('momentum')}>Momentum</button></header>
        <button className="ds-week" onClick={() => openSheet('momentum')} aria-label="Momentum this week. See the breakdown">
          <MomentumRings size={64} stroke={6} />
          <div className="ds-stat3">{MOMENTUM.map((m, i) => <div key={m.k}><small>{m.k}</small><b className="num">{['2 of 3', '5 of 7 days', 'Good'][i]}</b></div>)}</div>
        </button>
      </section>

      <div className="ds-actions">
        <Link href="/fuel"><Utensils {...I} />Log food</Link>
        <Link href="/chat"><MessageCircle {...I} />Message Kyle</Link>
        <Link href="/kai"><Sparkles {...I} style={{ color: 'var(--violet)' }} />Ask KAI</Link>
      </div>

      <Link className="ds-quote" href="/chat"><img src="/kd-mark.png" alt="" /><span><small>Kyle · yesterday</small><p>Leg press goes up today. Take the first set steady.</p></span></Link>
    </div>
  );
}

function Top({ me, unread }: { me: string; unread: boolean }) {
  return (
    <div className="ds-top"><img className="logo" src="/kd-mark.png" alt="KD Personal Training" />
      <div className="right">
        <Link className="ds-iconbtn" href="/notifications" aria-label={unread ? 'Notifications, new' : 'Notifications'}><Bell {...I} size={22} />{unread && <span className="dot" />}</Link>
        <Link className="ds-me" href="/profile" aria-label="You: profile and settings">{me}</Link>
      </div></div>
  );
}

// A brand-new client has no programme, sessions or history yet. Show what
// happens next instead of empty versions of an established client's screen.
function NewClientHome() {
  const s = useClient(), { me } = useUI(), live = useLive(), w = useCurrentWorkout(s);
  const plan = live?.plan, ci = live?.checkin;
  const coming = (live?.bookings ?? []).filter(b => isUpcoming(shownState(b, b.pending)) && Date.parse(b.end) >= Date.now());
  const next = coming[0], toConfirm = coming.filter(b => shownState(b, b.pending) === 'awaiting_client').length;
  const steps: [string, string, 'done' | 'now' | 'next'][] = [
    ['Health questions', 'Done. Kyle reads them before you start', 'done'],
    plan ? ['Your programme', `${plan.name} is ready`, 'done'] : ['Your programme', 'Kyle builds it around your goal', 'now'],
    ['First session', 'Kyle will send you a time to accept', 'next'],
  ];
  const inProgress = s.startedAt != null;
  return (
    <div className="ds ds-page fade">
      <Top me={me.initials} unread={!s.read} />
      <div><div className="ds-eyebrow">{plan ? `Week ${plan.week}${plan.weeks ? ` of ${plan.weeks}` : ''}` : 'Getting started'}</div><h1 className="ds-title">Hi, {me.first}</h1></div>
      {plan && w && (
        <section className="ds-card" aria-label="Your next workout">
          <div><div className="ds-eyebrow" style={{ color: inProgress ? 'var(--amber)' : 'var(--mint)' }}>{inProgress ? 'In progress' : 'Up next'}</div>
            <h2 className="ds-h2" style={{ marginTop: 6, fontSize: 24 }}>{w.name}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--fg2)', fontSize: 14 }} className="num">{planFor(s.duration, w).items.length} exercises · about {planFor(s.duration, w).minutes} min</p></div>
          <Link className="ds-btn primary" href="/workout"><Dumbbell {...I} />{inProgress ? 'Carry on' : 'Start workout'}</Link>
        </section>
      )}
      {(ci || next) && (
        <section className="ds-section">
          <header><h2 className="ds-h2">Coming up</h2></header>
          <div className="ds-list">
            {next && <Link className="ds-row" href="/sessions"><CalendarClock {...I} /><span className="t"><b>Session with Kyle</b><small>{ukWhen(next.start)}{next.location ? ` · ${next.location}` : ''}</small></span>
              <span className="end">{toConfirm ? <span className="ds-tag wait">{toConfirm > 1 ? `${toConfirm} to confirm` : 'Please confirm'}</span> : <span className="ds-tag ok">{CLIENT_LABEL[shownState(next, next.pending)][0]}</span>}<ChevronRight {...I} /></span></Link>}
            {ci && (ci.submittedAt
              ? <Link className="ds-row" href="/checkin"><ClipboardCheck {...I} /><span className="t"><b>Check-in sent</b><small>{ci.reply ? 'Kyle replied' : `Next one ${prettyDate(ci.nextRound)}`}</small></span><span className="end">{ci.reply && <span className="ds-tag ok">Reply</span>}<ChevronRight {...I} /></span></Link>
              : <Link className="ds-row" href="/checkin"><ClipboardCheck {...I} /><span className="t"><b>Check-in</b><small>Due {prettyDate(ci.round)} · 2 minutes</small></span><span className="end"><span className="ds-tag wait">To do</span><ChevronRight {...I} /></span></Link>)}
          </div>
        </section>
      )}
      <section className="ds-section">
        <header><h2 className="ds-h2">{plan ? 'Getting started' : 'What happens next'}</h2></header>
        <ol className="ds-list ds-steps">{steps.map(([t, d, st], i) => (
          <li key={t} className={`ds-row noicon ${st}`}><span className="t"><b><span className="n num">{st === 'done' ? '✓' : i + 1}</span>{t}</b><small>{d}</small></span>
            {st === 'now' && <span className="end"><span className="ds-tag wait">In progress</span></span>}</li>
        ))}</ol>
      </section>
      <div className="ds-actions">
        <Link href="/fuel"><Utensils {...I} />Log food</Link>
        <Link href="/chat"><MessageCircle {...I} />Message Kyle</Link>
        {live ? <Link href="/sessions"><CalendarClock {...I} />Sessions</Link> : <Link href="/tour"><Sparkles {...I} />App tour</Link>}
      </div>
      {!live && <Link className="ds-quote" href="/chat"><img src="/kd-mark.png" alt="" /><span><small>Kyle · just now</small><p>Welcome {me.first}! I&apos;ll have your programme ready before our first session.</p></span></Link>}
    </div>
  );
}
