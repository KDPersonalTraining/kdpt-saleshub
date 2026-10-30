'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Chev, Empty, Li, SubTop } from '@/components/client/ui';
import { EXLIB, KIT, PATTERNS, patternOf } from '@/lib/client/sample-data';

export default function Library() {
  const [q, setQ] = useState('');
  const [pat, setPat] = useState('all');
  const list = EXLIB.filter(e => (pat === 'all' || e.pattern === pat) && e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page fade">
      <SubTop title="Exercises" back="/train" />
      <label className="search"><Icon name="search" /><input placeholder={`Search ${EXLIB.length} exercises`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search exercises" /></label>
      <div className="liftchips">{PATTERNS.map(([k, l]) => <button key={k} className={pat === k ? 'on' : ''} onClick={() => setPat(k)}>{l}</button>)}</div>
      {list.length ? (
        <div className="group" style={{ '--inset': '68px' } as React.CSSProperties}>{list.map(e => { const p = patternOf(e.pattern); return (
          <Link key={e.id} className="optrow" href={`/library/${e.id}`}><Li icon={p[2]} color={p[3]} /><span className="t"><b>{e.name}</b><small>{p[1]} · {KIT[e.kit][0]}</small></span><Chev /></Link>
        ); })}</div>
      ) : (
        <Empty icon="search" color="var(--fg2)" title="Nothing found" cta={<Link className="pill-btn dark" href="/chat">Message your coach</Link>}>Try another name, or ask your coach to add it.</Empty>
      )}
    </div>
  );
}
