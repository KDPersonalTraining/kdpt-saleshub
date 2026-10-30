'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev } from '@/components/client/ui';
import { PROGRAMME } from '@/lib/client/sample-data';
import { useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';

export default function Train() {
  const s = useClient(), { toast } = useUI(), p = planFor(s.duration);
  return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">Your programme</div><h1>{PROGRAMME.name}</h1></div>
      <div className="card block">
        <div className="sec-head"><span className="d" style={{ fontWeight: 700 }}>Week {PROGRAMME.week} <span style={{ color: 'var(--fg3)' }}>of {PROGRAMME.weeks}</span></span><span className="chip" style={{ color: 'var(--mint)' }}><Icon name="bolt" /> On track</span></div>
        <div className="segs">{Array.from({ length: PROGRAMME.weeks }, (_, i) => <i key={i} className={i < PROGRAMME.week - 1 ? 'on' : i === PROGRAMME.week - 1 ? 'cur' : ''} />)}</div>
      </div>
      <div className="group" style={{ '--inset': '82px' } as React.CSSProperties}>
        {PROGRAMME.days.map(([n, c, m]) => {
          const inner = (<>
            <span className="tile"><Icon name={c === 'done' ? 'check' : c === 'today' ? 'play' : 'train'} /></span>
            <span className="t"><b>{n}</b><span>{c === 'today' ? `${p.items.length} exercises · ${p.minutes} min` : m}</span></span><Chev />
          </>);
          return c === 'today'
            ? <Link key={n} className={`wrow ${c}`} href="/workout">{inner}</Link>
            : <button key={n} className={`wrow ${c}`} onClick={() => toast(c === 'done' ? `${n} · done Tuesday` : `${n} · comes up later this week`)}>{inner}</button>;
        })}
      </div>
      <div className="actions" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <Link className="act" href="/library"><i style={{ background: 'var(--s2)' }}><Icon name="layers" /></i>Library</Link>
        <Link className="act" href="/history"><i style={{ background: 'var(--s2)' }}><Icon name="clock" /></i>History</Link>
        <Link className="act" href="/progress?tab=1"><i style={{ background: 'var(--s2)' }}><Icon name="trophy" /></i>Records</Link>
      </div>
    </div>
  );
}
