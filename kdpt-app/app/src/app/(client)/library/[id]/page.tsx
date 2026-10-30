'use client';

import Link from 'next/link';
import { use } from 'react';
import { useUI } from '@/components/client/shell';
import { Chev, Explain, Eyebrow, Li, SubTop } from '@/components/client/ui';
import { EXLIB, KIT, LIFTS, patternOf } from '@/lib/client/sample-data';
import { estimateOneRepMax } from '@/lib/rules';

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useUI();
  const e = EXLIB.find(x => x.id === id) ?? EXLIB[0], p = patternOf(e.pattern), rows = LIFTS[e.name];
  const last = rows?.[rows.length - 1];
  return (
    <div className="page fade">
      <SubTop title={e.name} back="/library" />
      <div className="demo" style={{ '--c': p[3] } as React.CSSProperties}><Li icon="film" color={p[3]} /><b>Demo coming soon</b><small>Kyle is filming this one. For now, follow the steps below.</small></div>
      <div className="exfacts">
        <div><Li icon={p[2]} color={p[3]} /><small>Pattern</small><b>{p[1]}</b></div>
        <div><Li icon={KIT[e.kit][1]} color="var(--sky)" /><small>Kit</small><b>{KIT[e.kit][0]}</b></div>
        <div><Li icon="heart" color="var(--coral)" /><small>Works</small><b>{e.muscles}</b></div>
      </div>
      <div><Eyebrow>How to do it</Eyebrow><ol className="cues">{e.cues.map(c => <li key={c}>{c}</li>)}</ol></div>
      {rows && last ? (
        <div className="card big-stat"><div className="eyebrow">Your best</div>
          <div className="delta num">{last[1]} kg × {last[2]}</div>
          <div className="lbl num">Est. 1-rep max {Math.round(estimateOneRepMax(last[1], last[2]) ?? 0)} kg · up from {rows[0][1]} kg in September</div>
          <Link className="pill-btn dark" style={{ marginTop: 12 }} href={`/progress?lift=${encodeURIComponent(e.name)}`}>See every session</Link></div>
      ) : <Explain>You haven&apos;t done this one yet. Once you log it, your best set shows here.</Explain>}
      <div><Eyebrow>Approved swaps</Eyebrow><div className="group" style={{ '--inset': '68px' } as React.CSSProperties}>{e.swaps.map(n => {
        const x = EXLIB.find(y => y.name === n);
        const inner = <><Li icon="swap" color="var(--violet)" /><span className="t"><b>{n}</b><small>Same sets and reps</small></span><Chev /></>;
        return x ? <Link key={n} className="optrow" href={`/library/${x.id}`}>{inner}</Link> : <button key={n} className="optrow" onClick={() => toast(`${n}: your coach has approved this swap`)}>{inner}</button>;
      })}</div></div>
      <Link className="pill-btn dark" href="/kai">Ask KAI about this exercise</Link>
    </div>
  );
}
