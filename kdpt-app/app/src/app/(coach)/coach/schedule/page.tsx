'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Avatar, Head, Modal, Sec, Switch, Tag, Tile } from '@/components/coach/ui';
import { APPROVE, AVAIL, CAL_END, CAL_START, DAYNAMES, DAYS, DEFAULT_HOURS, EVENTS, HOUR, REQS, byId, hhmm, type CalEvent } from '@/lib/coach/sample-data';

type Block = { day: number; from: number; to: number; reason: string; weekly: boolean };

export default function Schedule() {
  const toast = useToast();
  const [mode, setMode] = useState<'coach' | 'self'>('coach');
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [drafted, setDrafted] = useState(false);
  const [availDone, setAvailDone] = useState<Record<string, boolean>>({});
  const [approved, setApproved] = useState<Record<string, string>>({});
  const [reqDone, setReqDone] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<'hours' | 'block' | null>(null);

  const off: CalEvent[] = [];
  DAYNAMES.forEach((d, i) => { const h = hours[d];
    if (!h) { off.push([i, CAL_START, CAL_END - CAL_START, 'off', 'Not working', '']); return; }
    if (h[0] > CAL_START) off.push([i, CAL_START, h[0] - CAL_START, 'off', '', '']);
    if (h[1] < CAL_END) off.push([i, h[1], CAL_END - h[1], 'off', 'Not working', 'Outside your hours']); });
  const evs = [...off, ...EVENTS, ...blocks.map(b => [b.day, b.from, b.to - b.from, 'block', b.reason || 'Blocked', 'Blocked by you' + (b.weekly ? ' · weekly' : '')] as CalEvent)];
  const H = (CAL_END - CAL_START) * HOUR;
  const first = (id: string) => byId(id).name.split(' ')[0];

  return (
    <>
      <Head title="Schedule" sub={mode === 'coach' ? 'You propose every session. Clients reply, and nothing is booked until you confirm it.' : 'Clients pick from your open times, within their monthly allowance.'}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><Tag c="mint" icon="check">Google Calendar synced 2 min ago</Tag>
          <button className="btn white" onClick={() => setModal('block')}><Icon name="close" className="sm" />Block time</button>
          <button className="btn mint" onClick={() => toast('November drafted from everyone\'s regular slots. Review, then send on the 20th')}><Icon name="schedule" className="sm" />Schedule November</button></div></Head>
      <div className="card srules">
        <div><span className="eyebrow">Who sets sessions</span><span className="modes">{([['coach', 'You schedule'], ['self', 'Clients pick']] as const).map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</span>
          <small>{mode === 'coach' ? 'You place each client into their regular slot. They can only request changes.' : 'Clients choose open slots themselves. You still approve changes inside 24 hours.'}</small></div>
        <div><span className="eyebrow">Monthly cycle</span><b>Proposed on the 20th, confirmed by you</b><small>Clients reply by the 25th. Nothing is booked until you confirm it, whoever entered it.</small></div>
        <div><span className="eyebrow">Busy time</span><b>Google Calendar blocks your diary</b><small>Anything in your Google Calendar can&apos;t be booked. Time you block here is added to it too.</small></div>
      </div>
      <div className="card hoursbar"><span className="eyebrow">Working hours</span>{DAYNAMES.map(d => { const h = hours[d]; return <span key={d} className={`hd ${h ? '' : 'off'}`}><b>{d}</b>{h ? `${hhmm(h[0])}–${hhmm(h[1])}` : 'Off'}</span>; })}
        <button className="btn line" onClick={() => setModal('hours')}>Edit hours</button></div>
      <div className="grid2 wide">
        <section className="card calwrap">
          <div className="cal">
            <div style={{ borderBottom: '1px solid var(--hair)' }} />
            {DAYS.map(([d, n]) => <div key={d} className={`colh ${n === 21 ? 'today' : ''}`}>{d}<b className="num">{n}</b></div>)}
            <div className="times" style={{ height: H }}>{Array.from({ length: CAL_END - CAL_START }, (_, i) => <span key={i} style={{ top: i * HOUR }}>{CAL_START + i}:00</span>)}</div>
            {DAYS.map((_, di) => (
              <div key={di} className="col" style={{ height: H }}>{evs.filter(e => e[0] === di).map(([, st, len, k, t, sub], j) => (
                <button key={j} className={`ev2 ${k}`} style={{ top: (st - CAL_START) * HOUR + 1, height: len * HOUR - 3 }} onClick={() => toast(`${t || 'Not working'} · ${hhmm(st)}–${hhmm(st + len)}`)}>
                  <b>{len >= 0.75 && k !== 'off' ? `${hhmm(st)} ` : ''}{t}</b>{len >= 1 ? sub : ''}</button>
              ))}</div>
            ))}
          </div>
          <div className="chips" style={{ padding: '12px 16px', borderTop: '1px solid var(--hair)' }}><Tag c="mint">Studio</Tag><Tag c="sky">Gym</Tag><Tag c="violet">Online</Tag><Tag c="grey">Busy in Google</Tag><Tag c="coral">Blocked by you</Tag><Tag c="amber">Waiting for you</Tag></div>
        </section>
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div><Sec title="Availability received" right={drafted ? 'KAI draft · you confirm' : <button className="btn violet" onClick={() => setDrafted(true)}><Icon name="spark" className="sm" />Draft times</button>} />
            <div className="card">{AVAIL.map(v => { const c = byId(v.c); return (
              <div className="req" key={v.id}><div className="who"><Avatar c={c} size={30} /><b>{c.name}</b><small style={{ color: 'var(--fg3)', marginLeft: 'auto' }}>{v.n} sessions</small></div>
                <div className="mv">{v.windows}</div>
                {drafted && (availDone[v.id] ? <Tag c="mint" icon="check">Booked · {first(v.c)} notified</Tag> : (<>
                  <div className="mv" style={{ color: 'var(--fg)' }}><span className="sc-label" style={{ marginRight: 6 }}><span className="orb"><Icon name="spark" /></span></span>{v.draft}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn mint" onClick={() => { setAvailDone({ ...availDone, [v.id]: true }); toast('Booked · added to both calendars'); }}>Confirm {v.n}</button>
                    <button className="btn ghost" onClick={() => toast('Drag the drafted sessions on the calendar to change them')}>Adjust</button></div></>))}
              </div>
            ); })}</div></div>
          <div><Sec title="Waiting for your approval" right={`${APPROVE.filter(a => !approved[a.id]).length} to review`} />
            <div className="card">{APPROVE.map(a => { const c = byId(a.c); return (
              <div className="req" key={a.id}><div className="who"><Avatar c={c} size={30} /><b>{c.name}</b></div><div className="mv">{a.what}</div>
                {approved[a.id] ? <Tag c="mint" icon="check">{approved[a.id]}</Tag> : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn mint" onClick={() => setApproved({ ...approved, [a.id]: a.ok })}>{a.okBtn}</button>
                    {a.review && <button className="btn ghost" onClick={() => toast('Opens each date to confirm or move individually')}>Review dates</button>}
                    <button className="btn line" onClick={() => setApproved({ ...approved, [a.id]: `Declined · ${first(a.c)} notified` })}>Decline</button></div>)}
              </div>
            ); })}</div></div>
          <div><Sec title="Change requests" right={`${REQS.filter(r => !reqDone[r.id]).length} waiting`} />
            <div className="card">{REQS.map(r => { const c = byId(r.c); return (
              <div className="req" key={r.id}><div className="who"><Avatar c={c} size={30} /><b>{c.name}</b></div>
                <div className="mv"><s>{r.from}</s> → <b style={{ color: 'var(--fg)' }}>{r.to}</b><br />“{r.note}”</div>
                {reqDone[r.id] ? <Tag c="mint" icon="check">{reqDone[r.id]}</Tag> : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{([['mint', 'Approve', 'Approved · calendar updated'], ['ghost', 'Offer another time', 'Offered Mon 2 Nov · 17:30'], ['line', 'Decline', 'Declined · original kept']] as const).map(([k, l, done]) => (
                    <button key={l} className={`btn ${k}`} onClick={() => setReqDone({ ...reqDone, [r.id]: done })}>{l}</button>))}</div>)}
              </div>
            ); })}</div></div>
          <div><Sec title="Time off" right={<button className="muted" onClick={() => setModal('block')}>+ Block time</button>} />
            <div className="card">{[['22–29 Dec', 'Christmas · all day'], ...blocks.map(b => [`${DAYS[b.day][0]} ${DAYS[b.day][1]} Oct`, `${hhmm(b.from)}–${hhmm(b.to)} · ${b.reason || 'Blocked'}`])].map(([t, d]) => (
              <div key={t + d} className="ev" style={{ padding: '12px 18px' }}><Tile icon="close" c="coral" /><span><b>{t}</b><small>{d}</small></span><span /></div>
            ))}</div></div>
        </section>
      </div>
      {modal === 'hours' && <HoursModal hours={hours} setHours={setHours} onClose={() => setModal(null)} />}
      {modal === 'block' && <BlockModal onClose={() => setModal(null)} onSave={b => { setBlocks([...blocks, b]); setModal(null); toast('Blocked · added to your Google Calendar'); }} />}
    </>
  );
}

function HoursModal({ hours, setHours, onClose }: { hours: typeof DEFAULT_HOURS; setHours: (h: typeof DEFAULT_HOURS) => void; onClose: () => void }) {
  const opts = (lo: number, hi: number) => { const o: number[] = []; for (let h = lo; h <= hi; h += 0.5) o.push(h); return o; };
  return (
    <Modal title="Working hours" onClose={onClose}>
      <span style={{ color: 'var(--fg3)' }}>Clients can only offer times inside these, and you can&apos;t be scheduled outside them.</span>
      {DAYNAMES.map(d => { const h = hours[d]; return (
        <div className="hrow" key={d}><b>{d}</b><Switch on={!!h} label={`Work on ${d}`} onChange={() => setHours({ ...hours, [d]: h ? null : [6.5, 19.5] })} />
          {h ? <div className="fields">
            <select value={h[0]} aria-label={`${d} start`} onChange={e => setHours({ ...hours, [d]: [+e.target.value, h[1]] })}>{opts(5, 12).map(x => <option key={x} value={x}>{hhmm(x)}</option>)}</select>
            <select value={h[1]} aria-label={`${d} finish`} onChange={e => setHours({ ...hours, [d]: [h[0], +e.target.value] })}>{opts(9, 22).map(x => <option key={x} value={x}>{hhmm(x)}</option>)}</select></div>
            : <span style={{ color: 'var(--fg3)' }}>Not working</span>}</div>
      ); })}
      <button className="btn mint" onClick={onClose} style={{ justifySelf: 'start' }}><Icon name="check" className="sm" />Save hours</button>
    </Modal>
  );
}

function BlockModal({ onClose, onSave }: { onClose: () => void; onSave: (b: Block) => void }) {
  const toast = useToast();
  const [b, setB] = useState<Block>({ day: 3, from: 12, to: 14, reason: '', weekly: false });
  const hours = Array.from({ length: 29 }, (_, i) => 6 + i / 2);
  return (
    <Modal title="Block time" onClose={onClose}>
      <span style={{ color: 'var(--fg3)' }}>Clients can&apos;t be scheduled into blocked time. It&apos;s added to your Google Calendar too.</span>
      <div className="fields">
        <label className="full">Day<select value={b.day} onChange={e => setB({ ...b, day: +e.target.value })}>{DAYS.map(([d, n], i) => <option key={d} value={i}>{d} {n} October</option>)}</select></label>
        <label>From<select value={b.from} onChange={e => setB({ ...b, from: +e.target.value })}>{hours.map(h => <option key={h} value={h}>{hhmm(h)}</option>)}</select></label>
        <label>To<select value={b.to} onChange={e => setB({ ...b, to: +e.target.value })}>{hours.map(h => <option key={h} value={h}>{hhmm(h)}</option>)}</select></label>
        <label className="full">Reason (only you see this)<input value={b.reason} placeholder="e.g. Dentist, school run, holiday" onChange={e => setB({ ...b, reason: e.target.value })} /></label>
      </div>
      <Switch on={b.weekly} label="Repeat every week" onChange={() => setB({ ...b, weekly: !b.weekly })} />
      <button className="btn mint" style={{ justifySelf: 'start' }} onClick={() => (b.to <= b.from ? toast('End time must be after the start') : onSave(b))}><Icon name="check" className="sm" />Block it</button>
    </Modal>
  );
}
