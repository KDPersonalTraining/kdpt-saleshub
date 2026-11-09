'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Empty } from '@/components/client/ui';
import { coveredLike, liftedLike } from '@/lib/client/fun';
import { useLive } from '@/lib/client/live';
import { shortDate } from '@/lib/programmes/plan';

// A real client's progress: totals, how each lift is going, personal bests
// and the last 8 weeks.
export function LiveProgress() {
  const p = useLive()!.progress;
  const [lift, setLift] = useState(0);
  if (!p.totals.sessions) return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow">Your progress</div><h1 className="ds-title">Progress</h1></div>
      <Empty icon="progress" color="var(--mint)" title="Your progress starts here">Your lifts, bests and weekly totals appear after your first workout.</Empty>
    </div>
  );
  const l = p.lifts[lift], first = l?.points[0], last = l?.points[l.points.length - 1];
  const up = l && last.e1rm - first.e1rm;
  const allLifted = liftedLike(p.totals.volume, 'all-time-lift'), allCovered = coveredLike(p.totals.distance, 'all-time-distance');
  const maxS = Math.max(1, ...p.weeks.map(w => w.sessions));
  return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow">Your progress</div><h1 className="ds-title">Progress</h1></div>

      <dl className="ds-totals">
        <div><dt>Workouts</dt><dd className="num">{p.totals.sessions}</dd></div>
        <div><dt>Lifted</dt><dd className="num">{p.totals.volume >= 1000 ? `${Math.round(p.totals.volume / 100) / 10}k` : p.totals.volume.toLocaleString('en-GB')}<small> kg</small></dd></div>
        {p.totals.distance > 0 && <div><dt>Distance</dt><dd className="num">{Math.round(p.totals.distance / 100) / 10}<small> km</small></dd></div>}
      </dl>
      {(allLifted || allCovered) && <p style={{ margin: 0, color: 'var(--fg2)' }}>So far you&apos;ve lifted about <b style={{ color: 'var(--fg)' }}>{allLifted?.words ?? 'nothing yet'}</b>{allCovered ? <> and covered <b style={{ color: 'var(--fg)' }}>{allCovered.words}</b></> : ''}.</p>}

      {l && (
        <section className="ds-section">
          <header><h2 className="ds-h2">Strength</h2></header>
          <label className="ds-select"><select value={lift} onChange={e => setLift(+e.target.value)} aria-label="Exercise">{p.lifts.map((x, i) => <option key={x.name} value={i}>{x.name}</option>)}</select><ChevronDown size={18} strokeWidth={1.75} /></label>
          <Trend values={l.points.map(x => x.e1rm)} />
          <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 14 }}>
            {up && up > 0 ? <>Estimated 1-rep max up <b style={{ color: 'var(--mint)' }}>{Math.round(up)} kg</b> since {shortDate(first.date)}. </> : <>Holding steady since {shortDate(first.date)}. </>}
            Latest best: {last.set}.</p>
        </section>
      )}

      {p.records.length > 0 && (
        <section className="ds-section">
          <header><h2 className="ds-h2">Personal bests</h2></header>
          <div className="ds-list">{p.records.slice(0, 8).map(r => (
            <div key={r.name} className="ds-row noicon"><span className="t"><b>{r.name}</b><small className="num">{r.set} · {shortDate(r.date)}</small></span><span className="end num">{r.e1rm} kg</span></div>
          ))}</div>
          <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 14 }}>Shown as an estimated 1-rep max, so a heavier set and a set with more reps can be compared. Compared only with you.</p>
        </section>
      )}

      <section className="ds-section">
        <header><h2 className="ds-h2">Last 8 weeks</h2></header>
        <div className="ds-weeks" role="img" aria-label={`Workouts per week: ${p.weeks.map(w => w.sessions).join(', ')}`}>{p.weeks.map(w => (
          <div key={w.start}><i style={{ height: `${(w.sessions / maxS) * 100}%` }} /><span className="num">{w.sessions}</span><small>{shortDate(w.start).slice(4)}</small></div>
        ))}</div>
      </section>
    </div>
  );
}

function Trend({ values }: { values: number[] }) {
  const w = 320, h = 120, pad = 10, min = Math.min(...values), max = Math.max(...values);
  const xy = values.map((v, i) => [pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1), h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad)]);
  const d = xy.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const end = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--mint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="5" fill="var(--mint)" />
    </svg>
  );
}
