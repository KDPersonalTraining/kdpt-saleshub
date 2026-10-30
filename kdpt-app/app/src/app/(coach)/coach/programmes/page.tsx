'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Tag, Tile } from '@/components/coach/ui';
import { PROGRAMMES } from '@/lib/coach/sample-data';

export default function Programmes() {
  const toast = useToast();
  return (
    <>
      <Head title="Programmes" sub="Templates are copied when assigned, so editing one never changes a client's live plan.">
        <Link className="btn mint" href="/coach/programmes/new"><Icon name="plus" className="sm" />New template</Link></Head>
      <div className="cards3">{PROGRAMMES.map(([n, m, a, c]) => (
        <div className="card prog" key={n}><div className="top"><Tile icon="programmes" c={c} /><span><b>{n}</b><small>{m}</small></span></div>
          <div className="foot"><Tag c="grey" icon="clients">{a} clients</Tag><span style={{ display: 'flex', gap: 6 }}>
            <Link className="btn line" href={`/coach/programmes/${encodeURIComponent(n)}`}>Edit</Link>
            <button className="btn ghost" onClick={() => toast(`Pick a client to assign ${n}`)}>Assign</button></span></div></div>
      ))}</div>
    </>
  );
}
