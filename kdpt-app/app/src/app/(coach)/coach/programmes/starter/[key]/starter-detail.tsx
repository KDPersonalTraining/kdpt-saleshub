'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { AssignModal, type ClientOption } from '@/components/coach/assign';
import { Sec } from '@/components/coach/ui';
import { exerciseBySlug, phasesOf, starterByKey } from '@/lib/programmes/starters';

const PRIO = { must_keep: 'Always keep', keep_if_time: 'Keep if time', first_to_cut: 'Cut first' } as const;
const rest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// One starter programme: its phases, workouts and exercises, read-only.
export function StarterDetail({ k, clients, demo }: { k: string; clients: ClientOption[]; demo: boolean }) {
  const s = starterByKey(k)!;
  const phases = phasesOf(s);
  const [phase, setPhase] = useState(0);
  const [assign, setAssign] = useState(false);
  const [, a, b] = phases[phase];
  const shown = s.workouts.filter(w => (w.weeks?.[0] ?? 1) === a);
  return (
    <>
      <div className="head"><div><Link className="crumb" href="/coach/programmes"><Icon name="back" className="sm" />Programmes</Link>
        <h1>{s.name}</h1><p>{s.level} · {s.weeks} weeks · {s.daysPerWeek}. {s.summary}</p></div>
        <button className="btn mint" onClick={() => setAssign(true)}>Give to a client</button></div>

      {phases.length > 1 && (
        <div className="days" role="tablist">{phases.map(([label, from, to], i) => (
          <button key={label + from} role="tab" aria-selected={phase === i} className={`day ${phase === i ? 'on' : ''}`} onClick={() => setPhase(i)}>
            Weeks {from}–{to}<small> · {label}</small></button>
        ))}</div>
      )}
      <p className="muted" style={{ margin: 0 }}>Workouts rotate in order{shown.length > 1 ? `: after ${shown[shown.length - 1].name} comes ${shown[0].name} again` : ''}.{b < s.weeks ? ` Clients move to the next phase automatically at the start of week ${b + 1}.` : ''}</p>

      {shown.map(w => (
        <section key={w.name + a}>
          <Sec title={w.name} right={w.focus} />
          <div className="card">
            <div className="crow th" style={{ gridTemplateColumns: 'minmax(180px,1.6fr) 60px 80px 70px 120px minmax(0,1.4fr)', minWidth: 720 }}><span>Exercise</span><span>Sets</span><span>Reps</span><span>Rest</span><span>Short on time</span><span>Note for the client</span></div>
            {w.items.map((it, i) => { const e = exerciseBySlug(it.slug)!; return (
              <div key={i} className="crow" style={{ gridTemplateColumns: 'minmax(180px,1.6fr) 60px 80px 70px 120px minmax(0,1.4fr)', minWidth: 720 }}>
                <span><b>{e.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{e.muscles.join(', ')}</small></span>
                <span className="num">{it.sets}</span><span className="num">{it.reps[0] === it.reps[1] ? it.reps[0] : `${it.reps[0]}–${it.reps[1]}`}</span>
                <span className="num">{rest(it.rest)}</span><span style={{ color: 'var(--fg2)' }}>{PRIO[it.priority]}</span>
                <span style={{ color: 'var(--fg2)', fontSize: 13 }}>{it.note ?? ''}</span>
              </div>
            ); })}
          </div>
        </section>
      ))}
      <p className="muted" style={{ margin: 0 }}>Weights aren’t set in advance: the first time, the client picks one they could lift for a couple more reps. After that, when they hit the top of the range on every set, the app adds the exercise’s weight jump.</p>
      {assign && <AssignModal clients={clients} fixedKey={k} demo={demo} onClose={() => setAssign(false)} />}
    </>
  );
}
