'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Li, Ring } from '@/components/client/ui';
import { LIFTS, WORKOUT } from '@/lib/client/sample-data';
import { summarise } from '@/lib/client/summary';
import { resetWorkout, setState, useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';
import { estimateOneRepMax } from '@/lib/rules';

// Best estimated 1-rep max on record before today, per exercise.
const bestBefore = (name: string) => Math.max(0, ...(LIFTS[name] ?? []).map(([, w, r]) => estimateOneRepMax(w, r) ?? 0));

export default function WorkoutDone() {
  const s = useClient();
  const items = planFor(s.duration).items;
  const sum = summarise({ exercises: items.map(({ ex }) => ({ id: ex.id, name: s.swaps[ex.id] ?? ex.name, last: ex.last, best: s.swaps[ex.id] ? 0 : bestBefore(ex.name) })),
    logs: s.logs, skipped: s.skipped, startedAt: s.startedAt, finishedAt: s.finishedAt });
  const notes = Object.values(s.exNotes).filter(m => m.rpe || m.note).length;
  return (
    <div className="finish fade">
      <svg viewBox="0 0 150 150" width="150" height="150"><Ring size={150} stroke={14} pct={1} color="var(--mint)" />
        <g transform="translate(47 47)" color="var(--mint)"><svg width="56" height="56" viewBox="0 0 24 24"><path d="m4.5 12.5 4.8 4.8L19.5 7" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg></g></svg>
      <div><div className="eyebrow">{WORKOUT.name}</div><h1>Workout done</h1></div>
      <div className="stats num">
        <div className="stat"><Icon name="clock" style={{ color: 'var(--sky)' }} /><b>{sum.minutes ? `${sum.minutes} min` : '–'}</b><small>Time</small></div>
        <div className="stat"><Icon name="layers" style={{ color: 'var(--violet)' }} /><b>{sum.sets}</b><small>Sets done</small></div>
        <div className="stat" style={{ gridColumn: '1 / -1' }}><Icon name="weight" style={{ color: 'var(--amber)' }} /><b>{sum.volumeKg.toLocaleString('en-GB')} kg</b><small>Lifted in total (weight × reps)</small></div>
      </div>
      {sum.records.length > 0 && (
        <div className="group" style={{ width: '100%' }}>{sum.records.map(r => (
          <div className="rec" key={r.exercise}><Li icon="trophy" color="var(--amber)" /><span className="t"><b>New best · {r.exercise}</b><small className="num">{r.set} · est. 1-rep max {r.now} kg (was {r.was})</small></span></div>
        ))}</div>
      )}
      {(sum.skipped.length > 0 || notes > 0) && (
        <p className="fine" style={{ textAlign: 'center' }}>{[sum.skipped.length ? `Skipped: ${sum.skipped.join(', ')}` : '', notes ? 'Your notes go to Kyle' : ''].filter(Boolean).join(' · ')}</p>
      )}
      <Link className="pill-btn white" style={{ width: '100%' }} href="/home" onClick={() => setState(resetWorkout())}>Done</Link>
    </div>
  );
}
