'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Ring, fmtSecs } from '@/components/client/ui';
import { WORKOUT } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

export default function WorkoutDone() {
  const s = useClient();
  const done = Object.values(s.logs).flat().filter(x => x.done);
  const vol = Math.round(done.reduce((v, x) => v + (parseFloat(x.load) || 0) * (parseFloat(x.reps) || 0), 0));
  return (
    <div className="finish fade">
      <svg viewBox="0 0 150 150" width="150" height="150"><Ring size={150} stroke={14} pct={1} color="var(--mint)" />
        <g transform="translate(47 47)" color="var(--mint)"><svg width="56" height="56" viewBox="0 0 24 24"><path d="m4.5 12.5 4.8 4.8L19.5 7" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg></g></svg>
      <div><div className="eyebrow">{WORKOUT.name}</div><h1>Workout done</h1></div>
      <div className="stats num">
        <div className="stat"><Icon name="clock" style={{ color: 'var(--sky)' }} /><b>{fmtSecs(47 * 60 + 12)}</b><small>Time</small></div>
        <div className="stat"><Icon name="weight" style={{ color: 'var(--amber)' }} /><b>{(vol || 8420).toLocaleString('en-GB')}</b><small>kg lifted</small></div>
        <div className="stat"><Icon name="layers" style={{ color: 'var(--violet)' }} /><b>{done.length || 16}</b><small>Sets</small></div>
        <div className="stat"><Icon name="trophy" style={{ color: 'var(--mint)' }} /><b>1</b><small>New best · Leg Press</small></div>
      </div>
      <Link className="pill-btn white" style={{ width: '100%' }} href="/home" onClick={() => setState({ idx: 0, logs: {}, swaps: {} })}>Done</Link>
    </div>
  );
}
