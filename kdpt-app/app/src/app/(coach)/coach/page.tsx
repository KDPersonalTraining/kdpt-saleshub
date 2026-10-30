'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Avatar, Head, Sec, Tag, Tile } from '@/components/coach/ui';
import { ALERTS, APPROVALS, TODAY, byId, type Tint } from '@/lib/coach/sample-data';

export default function CoachToday() {
  const router = useRouter();
  const [done, setDone] = useState<Record<string, string>>({});
  const [approved, setApproved] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>(Object.fromEntries(APPROVALS.map(a => [a.id, a.text])));
  const open = ALERTS.filter(a => !done[a.id]).length, pend = APPROVALS.filter(a => !approved[a.id]).length;
  const Kpi = ({ n, label, icon, c, href }: { n: number; label: string; icon: string; c: Tint; href?: string }) => {
    const inner = <><Tile icon={icon} c={c} /><span><b className="num">{n}</b><small>{label}</small></span></>;
    return href ? <Link className="card kpi" href={href}>{inner}</Link> : <div className="card kpi">{inner}</div>;
  };
  return (
    <>
      <Head eyebrow="Wednesday 21 October" title="Morning, Kyle" />
      <div className="kpis"><Kpi n={open} label="Need attention" icon="pain" c="coral" /><Kpi n={pend} label="To approve" icon="spark" c="violet" />
        <Kpi n={4} label="Sessions today" icon="schedule" c="sky" href="/coach/schedule" /><Kpi n={3} label="Unread" icon="messages" c="mint" href="/coach/messages" /></div>
      <div className="grid2">
        <section>
          <Sec title="Attention" right="Most urgent first" />
          <div className="card alist">{ALERTS.map(a => { const c = byId(a.c); return (
            <div key={a.id} className={`arow ${done[a.id] ? 'done' : ''}`}>
              <Avatar c={c} />
              <div><div className="who"><b>{c.name}</b><Tag c={a.tag[0]} icon={a.tag[1]}>{a.tag[2]}</Tag></div><p>{a.why}</p></div>
              <div className="acts">{done[a.id] ? <Tag c="mint" icon="check">{done[a.id]}</Tag> : (<>
                <Link className="iconbtn" title="Open client" aria-label={`Open ${c.name}`} href={`/coach/clients/${c.id}`}><Icon name="open" /></Link>
                <button className="iconbtn" title="Reply" aria-label="Reply" onClick={() => router.push(`/coach/messages?c=${c.id}`)}><Icon name="reply" /></button>
                <button className="iconbtn" title="KAI draft" aria-label="KAI draft" style={{ color: 'var(--violet)' }} onClick={() => setDone({ ...done, [a.id]: 'Drafting' })}><Icon name="spark" /></button>
                <button className="iconbtn" title="Snooze" aria-label="Snooze" onClick={() => setDone({ ...done, [a.id]: 'Snoozed' })}><Icon name="snooze" /></button>
              </>)}</div>
            </div>
          ); })}</div>
        </section>
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div>
            <Sec title={<><span className="orb"><Icon name="spark" /></span> KAI drafts</>} right="Nothing changes until you approve" />
            <div className="card">{APPROVALS.map(p => { const c = byId(p.c); return (
              <div className="appr" key={p.id}>
                <div className="top"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar c={c} size={30} /><b>{c.name.split(' ')[0]}</b></span><Tag c={p.kind[0]}>{p.kind[1]}</Tag></div>
                {editing === p.id ? <textarea className="fb" style={{ minHeight: 90 }} value={texts[p.id]} onChange={e => setTexts({ ...texts, [p.id]: e.target.value })} /> : <div className="draft">{texts[p.id]}</div>}
                {approved[p.id] ? <Tag c="mint" icon="check" style={{ justifySelf: 'start' }}>{approved[p.id]}</Tag> : (
                  <div className="row">
                    <button className="btn mint" onClick={() => { setApproved({ ...approved, [p.id]: editing === p.id ? 'Edited & sent' : 'Approved & sent' }); setEditing(null); }}><Icon name="check" className="sm" />{editing === p.id ? 'Save & send' : 'Approve'}</button>
                    {editing !== p.id && <button className="btn ghost" onClick={() => setEditing(p.id)}>Edit</button>}
                    <button className="btn line" onClick={() => { setApproved({ ...approved, [p.id]: 'Rejected · logged' }); setEditing(null); }}>Reject</button></div>
                )}
              </div>
            ); })}</div>
          </div>
          <div>
            <Sec title="Today" right={<Link className="muted" href="/coach/schedule">Full week →</Link>} />
            <div className="card tl">{TODAY.map(([t, id, w, c]) => (
              <Link key={t} className="tli" style={{ textAlign: 'left', width: '100%' }} href={`/coach/clients/${id}`}><time className="num">{t}</time><span className="bar" style={{ background: `var(--${c})` }} /><span><b>{byId(id).name}</b><small>{w}</small></span></Link>
            ))}</div>
          </div>
        </section>
      </div>
    </>
  );
}
