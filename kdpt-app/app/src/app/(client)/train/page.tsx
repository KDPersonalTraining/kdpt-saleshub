'use client';

import { Check, ChevronRight, Clock, Library, Play, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/client/shell';
import { Empty } from '@/components/client/ui';
import { PROGRAMME, WORKOUT } from '@/lib/client/sample-data';
import { useLive, type LivePlan } from '@/lib/client/live';
import { setState, useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';

// Train: the programme at a glance. The next workout is a photo card; every
// workout this week is its own card, with what's in it.
const I = { size: 20, strokeWidth: 1.75 } as const;

export default function Train() {
  const s = useClient(), { toast } = useUI(), p = planFor(s.duration), live = useLive();
  if (live?.plan) return <LiveTrain plan={live.plan} />;
  if (s.preview.fresh) return (
    <div className="ds ds-page">
      <div><h1 className="ds-title">Train</h1></div>
      <Empty icon="programmes" color="var(--mint)" title="Your programme is on its way" cta={<Link className="ds-btn secondary" href="/library">Browse exercises</Link>}>Kyle builds it after reading your health answers. It&apos;ll appear here.</Empty>
    </div>
  );
  const pct = ((PROGRAMME.week - 0.5) / PROGRAMME.weeks) * 100;
  const inProgress = s.startedAt != null;
  return (
    <div className="ds ds-page">
      <Header name={PROGRAMME.name} week={PROGRAMME.week} weeks={PROGRAMME.weeks} pct={pct} phase="On track" />
      <Link className="ds-hero" href="/workout">
        {inProgress && <span className="tag amber">In progress</span>}
        <h2>{WORKOUT.name}</h2>
        <p className="num">{p.items.length} exercises · about {p.minutes} min</p>
        <span className="go"><Play size={18} strokeWidth={2} fill="currentColor" />{inProgress ? 'Carry on' : 'Start workout'}</span>
      </Link>
      <section className="ds-section">
        <header><h2 className="ds-h2">This week</h2></header>
        <div className="ds-wcards">{PROGRAMME.days.map(([n, c, m], i) => (
          <button key={n} className={`ds-wcard ${c === 'done' ? 'done' : c === 'today' ? 'next' : ''}`} onClick={() => (c === 'today' ? null : toast(c === 'done' ? `${n} · done Tuesday` : `${n} · later this week`))}>
            <span className="day">{c === 'done' ? <Check size={20} strokeWidth={2.25} /> : i + 1}</span>
            <span><b>{n}</b><small className="num">{c === 'today' ? `${p.items.length} exercises · about ${p.minutes} min` : m}</small></span>
            <span className="ds-tag" style={{ color: c === 'done' ? 'var(--mint)' : c === 'today' ? 'var(--fg)' : 'var(--fg3)' }}>{c === 'done' ? 'Done' : c === 'today' ? 'Today' : ''}</span>
          </button>
        ))}</div>
      </section>
      <More records />
    </div>
  );
}

function Header({ name, week, weeks, pct, phase }: { name: string; week: number; weeks: number | null; pct: number; phase?: string | null }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div><h1 className="ds-title">{name}</h1></div>
      {weeks ? <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span className="num"><b>Week {week}</b> <span style={{ color: 'var(--fg3)' }}>of {weeks}</span></span>{phase && <span style={{ color: 'var(--fg2)' }}>{phase}</span>}</div>
        <div className="ds-bar"><i style={{ width: `${pct}%` }} /></div>
      </div> : null}
    </div>
  );
}

function More({ records }: { records?: boolean }) {
  return (
    <section className="ds-section">
      <header><h2 className="ds-h2">More</h2></header>
      <div className="ds-list card">
        <Link className="ds-row" href="/history"><Clock {...I} /><span className="t"><b>History</b><small>Every session you&apos;ve logged</small></span><span className="end"><ChevronRight {...I} /></span></Link>
        <Link className="ds-row" href="/library"><Library {...I} /><span className="t"><b>Exercise library</b><small>How to do every exercise</small></span><span className="end"><ChevronRight {...I} /></span></Link>
        {records && <Link className="ds-row" href="/progress?tab=1"><Trophy {...I} /><span className="t"><b>Personal records</b><small>Your bests, compared only with you</small></span><span className="end"><ChevronRight {...I} /></span></Link>}
      </div>
    </section>
  );
}

// A real client's programme: this week's workouts in order, which are done,
// which is next, and what changes in the next phase.
function LiveTrain({ plan }: { plan: LivePlan }) {
  const s = useClient(), router = useRouter();
  const week = plan.workouts.filter(w => plan.thisWeek.includes(w.id));
  const phase = week.find(w => w.phase)?.phase;
  const nextPhase = plan.workouts.filter(w => (w.weekFrom ?? 1) > plan.week).sort((a, b) => (a.weekFrom ?? 0) - (b.weekFrom ?? 0))[0];
  const pct = plan.weeks ? ((plan.week - 0.5) / plan.weeks) * 100 : 0;
  const open = (id: string) => { if (s.startedAt == null) setState({ wid: id }); router.push('/workout'); };
  const inProgress = s.startedAt != null;
  const heroW = week.find(w => (inProgress ? w.id === s.wid : w.id === plan.nextId)) ?? week[0];
  const hf = heroW ? planFor(s.duration, heroW) : null;
  return (
    <div className="ds ds-page">
      <Header name={plan.name} week={plan.week} weeks={plan.weeks} pct={pct} phase={phase} />
      {heroW && hf && (
        <button className="ds-hero" onClick={() => open(heroW.id)} style={{ textAlign: 'left' }}>
          {inProgress && <span className="tag amber">In progress</span>}
          <h2>{heroW.name}</h2>
          <p className="num">{hf.items.length} exercises · about {hf.minutes} min{heroW.focus ? ` · ${heroW.focus}` : ''}</p>
          <span className="go"><Play size={18} strokeWidth={2} fill="currentColor" />{inProgress ? 'Carry on' : 'Start workout'}</span>
        </button>
      )}

      <section className="ds-section">
        <header><h2 className="ds-h2">This week</h2><span style={{ color: 'var(--fg3)', fontSize: 14 }}>{plan.doneThisWeek.length} of {week.length} done</span></header>
        <div className="ds-wcards">{week.map((w, i) => {
          const done = plan.doneThisWeek.includes(w.id), going = inProgress && s.wid === w.id, next = !going && !inProgress && w.id === plan.nextId;
          const f = planFor(s.duration, w);
          return (
            <button key={w.id} className={`ds-wcard ${done ? 'done' : ''} ${next || going ? 'next' : ''}`} onClick={() => open(w.id)}>
              <span className="day">{done ? <Check size={20} strokeWidth={2.25} /> : i + 1}</span>
              <span><b>{w.name}</b><small className="num">{f.items.length} exercises · about {f.minutes} min</small>
                <span className="chips">{w.exercises.slice(0, 3).map(e => <span key={e.id}>{e.name}</span>)}{w.exercises.length > 3 && <span>+{w.exercises.length - 3}</span>}</span></span>
              <span className="ds-tag" style={{ color: going ? 'var(--amber)' : next ? 'var(--mint)' : done ? 'var(--mint)' : 'var(--fg3)' }}>{going ? 'In progress' : next ? 'Up next' : done ? 'Done' : <ChevronRight {...I} />}</span>
            </button>
          );
        })}</div>
        {inProgress && <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 14 }}>Finish or leave the workout in progress to start a different one.</p>}
      </section>

      {nextPhase && <div className="ds-note" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}><span><small>Coming up · from week {nextPhase.weekFrom}</small><p>{nextPhase.phase ? <b>{nextPhase.phase}. </b> : null}New exercises come in, and Kyle&apos;s notes show you what&apos;s new.</p></span></div>}
      <More />
    </div>
  );
}
