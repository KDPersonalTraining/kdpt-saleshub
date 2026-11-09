'use client';

import { Check, ChevronRight, Clock, Dumbbell, Library, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/client/shell';
import { useLive, type LivePlan } from '@/lib/client/live';
import { setState } from '@/lib/client/store';
import { Empty } from '@/components/client/ui';
import { PROGRAMME } from '@/lib/client/sample-data';
import { useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';

const I = { size: 20, strokeWidth: 1.75 } as const;

export default function Train() {
  const s = useClient(), { toast } = useUI(), p = planFor(s.duration), live = useLive();
  if (live?.plan) return <LiveTrain plan={live.plan} />;
  if (s.preview.fresh) return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow">Your programme</div><h1 className="ds-title">Train</h1></div>
      <Empty icon="programmes" color="var(--mint)" title="Your programme is on its way" cta={<Link className="ds-btn secondary" href="/library">Browse exercises</Link>}>Kyle builds it after reading your health answers. It&apos;ll appear here.</Empty>
    </div>
  );
  const pct = ((PROGRAMME.week - 0.5) / PROGRAMME.weeks) * 100;
  return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow">Your programme</div><h1 className="ds-title">{PROGRAMME.name}</h1></div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span className="num"><b>Week {PROGRAMME.week}</b> <span style={{ color: 'var(--fg3)' }}>of {PROGRAMME.weeks}</span></span><span className="ds-tag ok">On track</span></div>
        <div className="ds-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <section className="ds-section">
        <header><h2 className="ds-h2">This week</h2></header>
        <div className="ds-list">{PROGRAMME.days.map(([n, c, m]) => {
          const inner = (<>
            {c === 'done' ? <Check {...I} style={{ color: 'var(--mint)' }} /> : <Dumbbell {...I} />}
            <span className="t"><b>{n}</b><small className="num">{c === 'today' ? `${p.items.length} exercises · about ${p.minutes} min` : m}</small></span>
            <span className="end">{c === 'today' ? <span className="ds-tag ok">{s.startedAt ? 'In progress' : 'Today'}</span> : c === 'done' ? <span className="ds-tag">Done</span> : null}<ChevronRight {...I} /></span>
          </>);
          return c === 'today'
            ? <Link key={n} className="ds-row" href="/workout">{inner}</Link>
            : <button key={n} className="ds-row" onClick={() => toast(c === 'done' ? `${n} · done Tuesday` : `${n} · later this week`)}>{inner}</button>;
        })}</div>
      </section>

      <section className="ds-section">
        <header><h2 className="ds-h2">More</h2></header>
        <div className="ds-list">
          <Link className="ds-row" href="/library"><Library {...I} /><span className="t"><b>Exercise library</b><small>How to do every exercise</small></span><span className="end"><ChevronRight {...I} /></span></Link>
          <Link className="ds-row" href="/history"><Clock {...I} /><span className="t"><b>History</b><small>Every session you&apos;ve logged</small></span><span className="end"><ChevronRight {...I} /></span></Link>
          <Link className="ds-row" href="/progress?tab=1"><Trophy {...I} /><span className="t"><b>Personal records</b><small>Your bests, compared only with you</small></span><span className="end"><ChevronRight {...I} /></span></Link>
        </div>
      </section>
    </div>
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
  return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow">Your programme</div><h1 className="ds-title">{plan.name}</h1></div>
      {plan.weeks && <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span className="num"><b>Week {plan.week}</b> <span style={{ color: 'var(--fg3)' }}>of {plan.weeks}</span></span>{phase && <span style={{ color: 'var(--fg2)' }}>{phase}</span>}</div>
        <div className="ds-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>}

      <section className="ds-section">
        <header><h2 className="ds-h2">This week</h2></header>
        <div className="ds-list">{week.map(w => {
          const done = plan.doneThisWeek.includes(w.id), going = s.startedAt != null && s.wid === w.id, next = !going && s.startedAt == null && w.id === plan.nextId;
          const f = planFor(s.duration, w);
          return (
            <button key={w.id} className="ds-row" onClick={() => open(w.id)}>
              {done ? <Check {...I} style={{ color: 'var(--mint)' }} /> : <Dumbbell {...I} />}
              <span className="t"><b>{w.name}</b><small className="num">{f.items.length} exercises · about {f.minutes} min{w.focus ? ` · ${w.focus}` : ''}</small></span>
              <span className="end">{going ? <span className="ds-tag wait">In progress</span> : next ? <span className="ds-tag ok">Up next</span> : done ? <span className="ds-tag">Done</span> : null}<ChevronRight {...I} /></span>
            </button>
          );
        })}</div>
        {s.startedAt != null && <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 14 }}>Finish or leave the workout in progress to start a different one.</p>}
      </section>

      {nextPhase && <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 14 }}>From week {nextPhase.weekFrom}{nextPhase.phase ? <>: <b>{nextPhase.phase}</b></> : ''}. New exercises come in, and Kyle&apos;s notes show you what&apos;s new.</p>}

      <section className="ds-section">
        <header><h2 className="ds-h2">More</h2></header>
        <div className="ds-list">
          <Link className="ds-row" href="/history"><Clock {...I} /><span className="t"><b>History</b><small>Every session you&apos;ve logged</small></span><span className="end"><ChevronRight {...I} /></span></Link>
          <Link className="ds-row" href="/library"><Library {...I} /><span className="t"><b>Exercise library</b><small>How to do every exercise</small></span><span className="end"><ChevronRight {...I} /></span></Link>
        </div>
      </section>
    </div>
  );
}
