'use client';

import { Check, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LIFTS } from '@/lib/client/sample-data';
import { useCurrentWorkout, useLive } from '@/lib/client/live';
import { flushOutbox } from '@/lib/client/sync';
import { parseLoad, parseReps, summarise } from '@/lib/client/summary';
import { resetWorkout, setState, useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';
import { clock, elapsedMs } from '@/lib/client/session';
import { estimateOneRepMax } from '@/lib/rules';

// Best estimated 1-rep max on record before today, per exercise.
const bestBefore = (name: string) => Math.max(0, ...(LIFTS[name] ?? []).map(([, w, r]) => estimateOneRepMax(w, r) ?? 0));

export default function WorkoutDone() {
  const s = useClient(), w = useCurrentWorkout(s), router = useRouter(), live = useLive();
  useEffect(() => { if (!w) router.replace('/home'); }, [w, router]);
  if (!w) return null;
  const items = planFor(s.duration, w).items;
  const sum = summarise({ exercises: items.map(({ ex }) => ({ id: ex.id, name: s.swaps[ex.id] ?? ex.name, last: ex.last,
    best: s.swaps[ex.id] ? 0 : live ? (w.exercises.find(e => e.id === ex.id)?.best ?? 0) : bestBefore(ex.name) })),
    logs: s.logs, skipped: s.skipped, startedAt: null, finishedAt: null });
  return (
    <div className="wm wm-summary">
      <div className="wm-sum-head"><span className="wm-cap ok"><Check size={16} strokeWidth={1.75} />Workout complete</span><h1>{w.name}</h1></div>
      <dl className="wm-stats">
        <div><dt>Time</dt><dd className="num">{s.startedAt != null && s.finishedAt ? clock(elapsedMs({ startedAt: s.startedAt, pausedMs: s.pausedMs, pausedAt: null }, s.finishedAt)) : '–'}</dd></div>
        <div><dt>Sets</dt><dd className="num">{sum.sets}</dd></div>
        <div><dt>Lifted</dt><dd className="num">{sum.volumeKg.toLocaleString('en-GB')}<small> kg</small></dd></div>
      </dl>
      {sum.records.length > 0 && (
        <section><span className="wm-cap">New personal bests</span>
          <ul className="wm-list">{sum.records.map(r => (
            <li key={r.exercise}><Trophy size={20} strokeWidth={1.75} style={{ color: 'var(--mint)' }} /><span><b>{r.exercise}</b><small className="num">{r.set} · est. 1-rep max {r.now} kg, up from {r.was}</small></span></li>
          ))}</ul></section>
      )}
      <section><span className="wm-cap">What you did</span>
        <ul className="wm-list">{items.map(({ ex }) => {
          const done = (s.logs[ex.id] ?? []).filter(x => x.done && parseReps(x.reps) !== null);
          const name = s.swaps[ex.id] ?? ex.name, meta = s.exNotes[ex.id];
          return (
            <li key={ex.id}><span><b>{name}</b>
              <small className="num">{s.skipped[ex.id] ? 'Skipped' : done.length ? done.map(x => `${ex.inc === 0 ? 'BW' : (parseLoad(x.load) ?? 0)}×${x.reps}`).join('  ') : 'Not logged'}{meta?.rpe ? ` · RPE ${meta.rpe}` : ''}</small></span></li>
          );
        })}</ul></section>
      {Object.values(s.exNotes).some(m => m.rpe || m.note) && <p className="wm-meta">Your ratings and notes go to Kyle.</p>}
      <Link className="wm-primary" href="/home" onClick={() => { setState(resetWorkout()); if (live) void flushOutbox().then(() => router.refresh()); }}>Done</Link>
    </div>
  );
}
