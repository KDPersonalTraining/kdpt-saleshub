'use client';

import { useState } from 'react';
import { Head, Switch, Tag, Tile } from '@/components/coach/ui';
import { RULES } from '@/lib/coach/sample-data';

export default function Automation() {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(RULES.map(r => [r[0], true])));
  return (
    <>
      <Head title="Automation" sub="Your rules, applied the same way to every client." />
      <div className="card rules">{RULES.map(([k, i, c, t, d, m]) => (
        <div className="rule" key={k}><Tile icon={i} c={c} /><span><b>{t}</b><small>{d}</small></span>
          <span className="right"><Tag c={m === 'Auto' ? 'grey' : 'violet'}>{m}</Tag><Switch on={on[k]} label={t} onChange={() => setOn({ ...on, [k]: !on[k] })} /></span></div>
      ))}</div>
    </>
  );
}
