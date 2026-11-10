'use client';

import { Bell, CalendarClock, ChevronRight, ClipboardCheck, CreditCard, MessageCircle, Play, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUI } from '@/components/client/shell';
import { MomentumRings } from '@/components/client/ui';
import { MOMENTUM, WORKOUT } from '@/lib/client/sample-data';
import { useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';
import { useCurrentWorkout, useLive } from '@/lib/client/live';
import { prettyDate } from '@/lib/programmes/plan';
import { CLIENT_LABEL, isUpcoming, shownState } from '@/lib/bookings/states';
import { ukWhen } from '@/lib/time';
import { trainedDays, ukToday, weekDays, type Day } from '@/lib/client/week';

// Home: who you are and what's next. The next workout is the big photo card;
// this week's days, quick actions, what's coming up and a note from Kyle follow.
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
  // Sample week: trained Monday and Tuesday; today is Wednesday.
  const days = weekDays('2026-10-21', ['2026-10-19', '2026-10-20']);

  return (
    <div className="ds ds-page">
      <Top me={me.initials} unread={!s.read} />
      <Hello initials={me.initials} eyebrow="Wednesday 21 October" title={`Morning, ${me.first}`} />

      <Link className="ds-hero" href="/workout" aria-label={`${inProgress ? 'Carry on' : 'Start'} ${WORKOUT.name}`}>
        {inProgress && <span className="tag amber">In progress</span>}
        <h2>{WORKOUT.name}</h2>
        <p className="num">{p.items.length} exercises · about {p.minutes} min</p>
        <span className="go"><Play size={18} strokeWidth={2} fill="currentColor" />{inProgress ? 'Carry on' : 'Start workout'}</span>
      </Link>

      <Week days={days} onOpen={() => openSheet('momentum')} />
      <Quick />

      <section className="ds-section">
        <header><h2 className="ds-h2">Coming up</h2></header>
        <div className="ds-list card">
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

      <button className="ds-card ds-week" onClick={() => openSheet('momentum')} aria-label="Momentum this week. See the breakdown">
        <MomentumRings size={64} stroke={6} />
        <div className="ds-stat3">{MOMENTUM.map((m, i) => <div key={m.k}><small>{m.k}</small><b className="num">{['2 of 3', '5 of 7 days', 'Good'][i]}</b></div>)}</div>
      </button>

      <Link className="ds-note" href="/chat"><img src="/kd-mark.png" alt="" /><span><small>Kyle · yesterday</small><p>Leg press goes up today. Take the first set steady.</p></span></Link>
    </div>
  );
}

function Top({ me, unread }: { me: string; unread: boolean }) {
  return (
    <div className="ds-top"><img className="logo" src="/kd-mark.png" alt="KD Personal Training" />
      <div className="right">
        <Link className="ds-kai" href="/kai" aria-label="Ask KAI, your AI assistant"><Sparkles {...I} size={18} />KAI</Link>
        <Link className="ds-iconbtn" href="/notifications" aria-label={unread ? 'Notifications, new' : 'Notifications'}><Bell {...I} size={22} />{unread && <span className="dot" />}</Link>
        <Link className="ds-me" href="/profile" aria-label="You: profile and settings">{me}</Link>
      </div></div>
  );
}

function Hello({ initials, eyebrow, title }: { initials: string; eyebrow: string; title: string }) {
  return <div className="ds-hello"><span className="av" aria-hidden="true">{initials}</span><span><small>{eyebrow}</small><h1>{title}</h1></span></div>;
}

function Week({ days, onOpen }: { days: Day[]; onOpen?: () => void }) {
  const n = days.filter(d => d.done).length;
  return (
    <section className="ds-section">
      <header><h2 className="ds-h2">This week</h2>{onOpen ? <button onClick={onOpen}>{n} workout{n === 1 ? '' : 's'}</button> : <span style={{ color: 'var(--fg3)', fontSize: 14 }}>{n} workout{n === 1 ? '' : 's'}</span>}</header>
      <div className="ds-days" aria-label={`Trained on ${n} day${n === 1 ? '' : 's'} this week`}>{days.map((d, i) => (
        <div key={d.date} className={`${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}><i style={{ animationDelay: `${i * 40}ms` }}>{d.done ? '✓' : Number(d.date.slice(8))}</i><small>{d.label}</small></div>
      ))}</div>
    </section>
  );
}

function Quick({ last }: { last?: React.ReactNode }) {
  return (
    <nav className="ds-quick" aria-label="Quick actions">
      <Link href="/fuel"><span className="ic"><Utensils {...I} /></span>Log food</Link>
      <Link href="/chat"><span className="ic"><MessageCircle {...I} /></span>Message</Link>
      <Link href="/kai"><span className="ic kai"><Sparkles {...I} /></span>Ask KAI</Link>
      {last ?? <Link href="/checkin"><span className="ic"><ClipboardCheck {...I} /></span>Check-in</Link>}
    </nav>
  );
}

// A new client, or a real client in live mode: their own programme, sessions
// and check-in; a "getting started" list until Kyle gives them a programme.
function NewClientHome() {
  const s = useClient(), { me } = useUI(), live = useLive(), w = useCurrentWorkout(s);
  const plan = live?.plan, ci = live?.checkin;
  const coming = (live?.bookings ?? []).filter(b => isUpcoming(shownState(b, b.pending)) && Date.parse(b.end) >= Date.now());
  const next = coming[0], toConfirm = coming.filter(b => shownState(b, b.pending) === 'awaiting_client').length;
  const inProgress = s.startedAt != null;
  const steps: [string, string, 'done' | 'now' | 'next'][] = [
    ['Health questions', 'Done. Kyle reads them before you start', 'done'],
    ['Your programme', 'Kyle builds it around your goal', 'now'],
    ['First session', 'Kyle will send you a time to accept', 'next'],
  ];
  const f = plan && w ? planFor(s.duration, w) : null;
  return (
    <div className="ds ds-page">
      <Top me={me.initials} unread={!s.read} />
      <Hello initials={me.initials} eyebrow={plan ? `Week ${plan.week}${plan.weeks ? ` of ${plan.weeks}` : ''} · ${plan.name}` : 'Getting started'} title={`Hi, ${me.first}`} />

      {plan && w && f ? (
        <Link className="ds-hero" href="/workout" aria-label={`${inProgress ? 'Carry on' : 'Start'} ${w.name}`}>
          {inProgress && <span className="tag amber">In progress</span>}
          <h2>{w.name}</h2>
          <p className="num">{f.items.length} exercises · about {f.minutes} min</p>
          <span className="go"><Play size={18} strokeWidth={2} fill="currentColor" />{inProgress ? 'Carry on' : 'Start workout'}</span>
        </Link>
      ) : (
        <section className="ds-hero slim" style={{ '--photo': 'url(/assets/gym.jpg)' } as React.CSSProperties}>
          <span className="tag">Welcome to KDPT</span>
          <h2>Your programme is on its way</h2>
          <p>Kyle builds it around your goal. It’ll appear here.</p>
        </section>
      )}

      {live && <Week days={weekDays(ukToday(), trainedDays(live.sessions))} />}
      <Quick last={live ? <Link href="/sessions"><span className="ic"><CalendarClock {...I} /></span>Sessions</Link> : <Link href="/tour"><span className="ic"><Sparkles {...I} /></span>App tour</Link>} />

      {(ci || next) && (
        <section className="ds-section">
          <header><h2 className="ds-h2">Coming up</h2></header>
          <div className="ds-list card">
            {next && <Link className="ds-row" href="/sessions"><CalendarClock {...I} /><span className="t"><b>Session with Kyle</b><small>{ukWhen(next.start)}{next.location ? ` · ${next.location}` : ''}</small></span>
              <span className="end">{toConfirm ? <span className="ds-tag wait">{toConfirm > 1 ? `${toConfirm} to confirm` : 'Please confirm'}</span> : <span className="ds-tag ok">{CLIENT_LABEL[shownState(next, next.pending)][0]}</span>}<ChevronRight {...I} /></span></Link>}
            {ci && (ci.submittedAt
              ? <Link className="ds-row" href="/checkin"><ClipboardCheck {...I} /><span className="t"><b>Check-in sent</b><small>{ci.reply ? 'Kyle replied' : `Next one ${prettyDate(ci.nextRound)}`}</small></span><span className="end">{ci.reply && <span className="ds-tag ok">Reply</span>}<ChevronRight {...I} /></span></Link>
              : <Link className="ds-row" href="/checkin"><ClipboardCheck {...I} /><span className="t"><b>Check-in</b><small>Due {prettyDate(ci.round)} · 2 minutes</small></span><span className="end"><span className="ds-tag wait">To do</span><ChevronRight {...I} /></span></Link>)}
          </div>
        </section>
      )}

      {!plan && (
        <section className="ds-section">
          <header><h2 className="ds-h2">What happens next</h2></header>
          <ol className="ds-list card ds-steps">{steps.map(([t, d, st], i) => (
            <li key={t} className={`ds-row noicon ${st}`}><span className="t"><b><span className="n num">{st === 'done' ? '✓' : i + 1}</span>{t}</b><small>{d}</small></span>
              {st === 'now' && <span className="end"><span className="ds-tag wait">In progress</span></span>}</li>
          ))}</ol>
        </section>
      )}

      {!live && <Link className="ds-note" href="/chat"><img src="/kd-mark.png" alt="" /><span><small>Kyle · just now</small><p>Welcome {me.first}! I&apos;ll have your programme ready before our first session.</p></span></Link>}
      {live && <Link className="ds-note" href="/chat"><img src="/kd-mark.png" alt="" /><span><small>Kyle</small><p>Any questions, message me here. I reply within a few hours.</p></span></Link>}
    </div>
  );
}

