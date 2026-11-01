'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { AlertPanel } from '@/components/coach/alert-panel';
import { Avatar, Head, Sec, Tag, Tile } from '@/components/coach/ui';
import { ALERTS, APPROVALS, APPROVE, REQS, TODAY, URGENCY, byId, type Tint } from '@/lib/coach/sample-data';

export default function CoachToday() {
  const [done, setDone] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [approved, setApproved] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>(Object.fromEntries(APPROVALS.map(a => [a.id, a.text])));
  const live = ALERTS.filter(a => !done[a.id]), resolved = ALERTS.filter(a => done[a.id]);
  const pend = APPROVALS.filter(a => !approved[a.id]).length;
  const open = ALERTS.find(a => a.id === openId);
  const Kpi = ({ n, label, icon, c, href }: { n: number; label: string; icon: string; c: Tint; href?: string }) => {
    const inner = <><Tile icon={icon} c={c} /><span><b className="num">{n}</b><small>{label}</small></span></>;
    return href ? <Link className="card kpi" href={href}>{inner}</Link> : <div className="card kpi">{inner}</div>;
  };
  return (
    <>
      <Head eyebrow="Wednesday 21 October" title="Morning, Kyle" />
      <div className="kpis"><Kpi n={TODAY.length} label="Sessions today" icon="schedule" c="sky" href="/coach/schedule" />
        <Kpi n={live.filter(a => a.urgency === 1).length} label="Need you today" icon="pain" c="coral" />
        <Kpi n={APPROVE.length + REQS.length} label="Bookings to approve" icon="calup" c="amber" href="/coach/schedule" />
        <Kpi n={3} label="Unread messages" icon="messages" c="mint" href="/coach/messages" /></div>
      <div className="grid2">
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          {([1, 2, 3] as const).map(u => { const list = live.filter(a => a.urgency === u); if (!list.length) return null; return (
            <div key={u}>
              <Sec title={URGENCY[u]} right={`${list.length}`} />
              <div className="card alist">{list.map(a => { const c = byId(a.c); return (
                <button key={a.id} className="arow" onClick={() => setOpenId(a.id)}>
                  <Avatar c={c} />
                  <div><div className="who"><b>{c.name}</b><Tag c={a.tag[0]} icon={a.tag[1]}>{a.tag[2]}</Tag></div><p>{a.why}</p></div>
                  <span className="go"><small>{a.when}</small><Icon name="right" className="sm" /></span>
                </button>
              ); })}</div>
            </div>
          ); })}
          {!live.length && <div className="card pad" style={{ textAlign: 'center' }}><Tile icon="check" c="mint" style={{ margin: '0 auto 10px' }} /><b>All clear</b><p className="muted" style={{ margin: '4px 0 0' }}>Nothing needs you right now.</p></div>}
          {resolved.length > 0 && (
            <details className="resolved"><summary>Dealt with today · {resolved.length}</summary>
              {resolved.map(a => (
                <div key={a.id}><span>{byId(a.c).name} · {a.tag[2]}</span><Tag c="mint" icon="check">{done[a.id]}</Tag>
                  <button className="btn line" onClick={() => { const d = { ...done }; delete d[a.id]; setDone(d); }}>Undo</button></div>
              ))}</details>
          )}
        </section>
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div>
            <Sec title="Today's sessions" right={<Link className="muted" href="/coach/schedule">Full week →</Link>} />
            <div className="card tl">{TODAY.map(([t, id, w, c]) => (
              <Link key={t} className="tli" style={{ textAlign: 'left', width: '100%' }} href={`/coach/clients/${id}`}><time className="num">{t}</time><span className="bar" style={{ background: `var(--${c})` }} /><span><b>{byId(id).name}</b><small>{w} · confirmed</small></span></Link>
            ))}</div>
          </div>
          <div>
            <Sec title={<><span className="orb"><Icon name="spark" /></span> KAI drafts · {pend}</>} right="Nothing is sent until you approve" />
            <div className="card">{APPROVALS.map(p => { const c = byId(p.c); return (
              <div className="appr" key={p.id}>
                <div className="top"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar c={c} size={30} /><b>{c.name.split(' ')[0]}</b></span><Tag c={p.kind[0]}>{p.kind[1]}</Tag></div>
                {editing === p.id ? <textarea className="fb" style={{ minHeight: 90 }} value={texts[p.id]} onChange={e => setTexts({ ...texts, [p.id]: e.target.value })} /> : <div className="draft">{texts[p.id]}</div>}
                {approved[p.id] ? <Tag c="mint" icon="check" style={{ justifySelf: 'start' }}>{approved[p.id]}</Tag> : (
                  <div className="row">
                    <button className="btn mint" onClick={() => { setApproved({ ...approved, [p.id]: editing === p.id ? 'Edited & sent' : 'Approved & sent' }); setEditing(null); }}><Icon name="check" className="sm" />{editing === p.id ? 'Save & send' : 'Approve'}</button>
                    {editing !== p.id && <button className="btn ghost" onClick={() => setEditing(p.id)}>Edit</button>}
                    <button className="btn line" onClick={() => { setApproved({ ...approved, [p.id]: 'Rejected' }); setEditing(null); }}>Reject</button></div>
                )}
              </div>
            ); })}</div>
          </div>
        </section>
      </div>
      {open && <AlertPanel a={open} onClose={() => setOpenId(null)} onResolve={label => { setDone({ ...done, [open.id]: label }); setTimeout(() => setOpenId(null), label === 'Dealt with' || label.startsWith('Snoozed') || label === 'Marked as paid' ? 0 : 900); }} />}
    </>
  );
}
