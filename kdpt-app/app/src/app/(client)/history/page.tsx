'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Chev, Empty, Explain, SubTop } from '@/components/client/ui';
import { HISTORY } from '@/lib/client/sample-data';
import { useClient } from '@/lib/client/store';

export default function History() {
  const s = useClient();
  const [open, setOpen] = useState<number | null>(0);
  if (s.preview.fresh) return (
    <div className="page fade"><SubTop title="History" back="/train" />
      <Empty icon="clock" color="var(--sky)" title="No sessions yet" cta={<Link className="pill-btn mint" href="/workout">Start your first workout</Link>}>
        Every workout you finish lands here, with every set, so you can see exactly what you lifted last time.</Empty>
    </div>
  );
  const vol = (r: typeof HISTORY[number]) => Math.round(r[3].reduce((t, [, sets]) => t + sets.reduce((a, [w, n]) => a + w * n, 0), 0));
  return (
    <div className="page fade">
      <SubTop title="History" back="/train" />
      <div className="stats">
        <div className="stat"><span style={{ color: 'var(--mint)' }}><Icon name="check" /></span><b className="num">23</b><small>Sessions since September</small></div>
        <div className="stat"><span style={{ color: 'var(--amber)' }}><Icon name="trophy" /></span><b className="num">9</b><small>Personal records</small></div></div>
      <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{HISTORY.map((r, i) => (
        <div key={i}>
          <button className="hrow" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span className="t"><b>{r[1]}</b><small className="num">{r[0]} · {r[2]} min · {vol(r).toLocaleString('en-GB')} kg lifted</small></span>
            {r[4] > 0 && <span className="pr" style={{ color: 'var(--amber)' }}><Icon name="trophy" /><span className="num">{r[4]}</span></span>}
            <Chev open={open === i} />
          </button>
          {open === i && <div className="hsets">{r[3].map(([n, sets]) => <div key={n}><b>{n}</b><span className="num">{sets.map(([w, k]) => `${w} × ${k}`).join(' · ')}</span></div>)}</div>}
        </div>
      ))}</div>
      <Explain>Tap a session to see every set. Your coach sees the same thing.</Explain>
    </div>
  );
}
