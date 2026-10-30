'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { FOODS, FREQ, HOURS, MOMENTUM, NOTIF_TYPES, NOV, hm, type Food, type Slot } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';
import { AccBars, Chev, Li, MomentumRings, Sent, Switch } from './ui';
import { useUI, type SheetName } from './shell';

export function Sheet({ name }: { name: SheetName }) {
  switch (name) {
    case 'pay': return <PaySheet />;
    case 'book': return <BookSheet />;
    case 'avail': return <AvailSheet />;
    case 'session': return <SessionSheet />;
    case 'momentum': return <MomentumSheet />;
    case 'time': return <TimeSheet />;
    case 'swap': return <SwapSheet />;
    case 'pain': return <PainSheet />;
    case 'notifset': return <><div><h3>Notifications</h3><div className="sub">Choose what reaches your phone</div></div><NotifToggles /><Done /></>;
    case 'addfood': return <AddFoodSheet />;
  }
}

const Done = ({ label = 'Done', dark }: { label?: string; dark?: boolean }) => {
  const { closeSheet } = useUI();
  return <button className={`pill-btn ${dark ? 'dark' : 'white'}`} onClick={closeSheet}>{label}</button>;
};

export function NotifToggles() {
  const s = useClient();
  return (
    <div className="toggles">{NOTIF_TYPES.map(([k, i, c, bg, l, sub]) => (
      <div className="tg" key={k}><span className="li" style={{ background: bg, color: c }}><Icon name={i} /></span><span className="t"><b>{l}</b><small>{sub}</small></span>
        <Switch on={!!s.notifs[k]} label={l} onChange={() => setState({ notifs: { ...s.notifs, [k]: !s.notifs[k] } })} /></div>
    ))}</div>
  );
}

function PaySheet() {
  const s = useClient(), { toast } = useUI(), fail = s.preview.payFail;
  if (s.paid) return <><Sent bg="var(--amber)" ink="#2a1600" title="Paid · thank you">Receipt sent to your email. {s.autopay ? 'December will be taken automatically.' : ''}</Sent><Done /></>;
  return (
    <>
      <div><h3>November payment</h3><div className="sub">{fail ? 'Failed on Sunday 1 November' : 'Due Sunday 1 November'}</div></div>
      {fail && <div className="failbox"><Icon name="pain" /><span><b>Your bank declined this payment.</b> Update your card or try again. Sessions stay booked for 7 days.</span></div>}
      <div className="paycard"><div className="line"><span>8 PT sessions</span><span className="num">£260.00</span></div><div className="line"><span>1–30 November</span><span /></div><div className="line total"><span>Total</span><span className="num">£260.00</span></div></div>
      <div className="cardrow"><span className="brand">VISA</span><span className="t"><b>•••• 4242</b><small>Expires 08/28</small></span><button onClick={() => toast('Change card in Stripe')} style={{ color: 'var(--fg2)', fontSize: 14 }}>Change</button></div>
      <div className="tg"><span className="li" style={{ background: 'rgba(255,180,94,.14)', color: 'var(--amber)' }}><Icon name="card" /></span><span className="t"><b>Pay automatically each month</b><small>Reminder 3 days before, cancel any time</small></span>
        <Switch on={s.autopay} label="Pay automatically" onChange={() => setState({ autopay: !s.autopay })} /></div>
      <button className="pill-btn mint" onClick={() => setState({ paid: true })}>{fail ? 'Try again · £260.00' : 'Pay £260.00'}</button>
    </>
  );
}

function BookSheet() {
  const s = useClient(), { openSheet } = useUI();
  const [pick, setPick] = useState<number | null>(null);
  const reqs = Object.keys(s.book.req).length;
  if (pick !== null) {
    const [d, day, t] = NOV[pick];
    const alts: [string, number, string][] = d === 'MON' ? [['MON', day, '17:30'], ['TUE', day + 1, '18:00'], ['WED', day + 2, '9:00']] : [['THU', day, '18:00'], ['FRI', day + 1, '7:00'], ['WED', day - 1, '9:00']];
    const cap = (x: string) => x.charAt(0) + x.slice(1).toLowerCase();
    return (
      <>
        <div><h3>Ask to move {cap(d)} {day} Nov</h3><div className="sub">Kyle&apos;s free times that week.</div></div>
        <div className="group">{alts.map(([dd, nn, tt]) => (
          <button key={dd + tt} className="optrow" onClick={() => { setState({ book: { ...s.book, req: { ...s.book.req, [pick]: `${cap(dd)} ${nn} Nov · ${tt}` } } }); setPick(null); }}>
            <span className="datebox sm"><small>{dd}</small><b className="num">{nn}</b></span><span className="t"><b className="num">{tt}</b><small>Studio</small></span><Chev /></button>
        ))}</div>
        <button className="pill-btn dark" onClick={() => { const req = { ...s.book.req }; delete req[pick]; setState({ book: { ...s.book, req } }); setPick(null); }}>Keep {t} on the {day}th</button>
      </>
    );
  }
  if (s.book.done) return <><Sent bg="var(--sky)" ink="#03121f" title="Sent to Kyle">You&apos;ll get a notification when Kyle confirms.</Sent><Done /></>;
  return (
    <>
      <div><h3>Your November sessions</h3><div className="sub">Move any that don&apos;t work. Nothing&apos;s booked until Kyle confirms.</div></div>
      <button className="optrow" style={{ background: 'var(--s2)', borderRadius: 14 }} onClick={() => openSheet('avail')}><Li icon="clock" color="var(--sky)" /><span className="t"><b>My times change each month</b><small>Send Kyle your availability instead</small></span><Chev /></button>
      <div className="group">{NOV.map(([d, day, t], i) => (
        <div className="optrow" key={i}><span className="datebox sm"><small>{d}</small><b className="num">{day}</b></span>
          <span className="t"><b className="num">{t} · Studio</b><small>{s.book.req[i] ? <span style={{ color: 'var(--amber)' }}>Asked for {s.book.req[i]}</span> : 'PT with Kyle · 60 min'}</small></span>
          <button className="add" style={{ color: 'var(--sky)' }} onClick={() => setPick(i)}>{s.book.req[i] ? 'Change' : 'Move'}</button></div>
      ))}</div>
      <p className="foot">Free to change up to 24 hours before. Later cancellations count as used.</p>
      <button className="pill-btn mint" onClick={() => setState({ book: { ...s.book, done: true } })}>Send to Kyle{reqs ? ` · ${reqs} change${reqs > 1 ? 's' : ''}` : ''}</button>
    </>
  );
}

function AvailSheet() {
  const s = useClient(), a = s.avail;
  if (a.sent) return <><Sent bg="var(--sky)" ink="#03121f" title="Sent to Kyle">You&apos;ll get a notification with your sessions.</Sent><Done /></>;
  const steps = (lo: number, hi: number) => { const o: number[] = []; for (let h = lo; h <= hi; h += 0.5) o.push(h); return o; };
  const setDay = (d: string, w: [number, number] | null) => setState({ avail: { ...a, days: { ...a.days, [d]: w } } });
  return (
    <>
      <div><h3>When can you train in November?</h3><div className="sub">Pick your days and rough times. Kyle confirms the exact slots.</div></div>
      <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{Object.entries(HOURS).map(([d, hrs]) => {
        const w = a.days[d];
        if (!hrs) return <div className="avrow off" key={d}><b>{d}</b><span className="t">Kyle doesn&apos;t work {d === 'Sat' ? 'Saturdays' : 'Sundays'}</span></div>;
        return (
          <div className="avrow" key={d}><b>{d}</b><span className="t">{w ? (
            <><select value={w[0]} aria-label={`${d} from`} onChange={e => setDay(d, [+e.target.value, w[1]])}>{steps(hrs[0], hrs[1] - 1).map(h => <option key={h} value={h}>{hm(h)}</option>)}</select> to{' '}
              <select value={w[1]} aria-label={`${d} until`} onChange={e => setDay(d, [w[0], +e.target.value])}>{steps(hrs[0] + 1, hrs[1]).map(h => <option key={h} value={h}>{hm(h)}</option>)}</select></>
          ) : <small>Kyle&apos;s hours {hm(hrs[0])}–{hm(hrs[1])}</small>}</span>
            <Switch on={!!w} label={d} onChange={() => setDay(d, w ? null : [hrs[0], hrs[1]])} /></div>
        );
      })}</div>
      <label className="search" style={{ height: 'auto', padding: '12px 14px' }}><input placeholder="Anything else? e.g. not the week of the 16th" value={a.note} aria-label="Note for Kyle" onChange={e => setState({ avail: { ...a, note: e.target.value } })} /></label>
      <button className="pill-btn mint" onClick={() => setState({ avail: { ...a, sent: true } })}>Send to Kyle</button>
    </>
  );
}

function SessionSheet() {
  const s = useClient(), { toast, openSheet } = useUI(), router = useRouter();
  const [step, setStep] = useState<'view' | 'confirm'>('view');
  if (s.sessionCancelled) return (
    <><Sent icon="close" bg="var(--coral)" ink="#2a0703" title="Session cancelled">Thursday 7:00 is cancelled and Kyle has been told. Because it was within 24 hours, it counts as used: {s.sessionsLeft} of 8 left in October.</Sent>
      <button className="pill-btn dark" onClick={() => router.push('/chat')}>Message Kyle</button><Done /></>
  );
  if (step === 'confirm') return (
    <>
      <div><h3>Cancel Thursday 7:00?</h3><div className="sub">It&apos;s less than 24 hours away.</div></div>
      <div className="explain" style={{ border: '1px solid rgba(255,107,94,.35)' }}><Icon name="pain" /><span>Cancelling within 24 hours counts as one of your sessions, so you&apos;d have {s.sessionsLeft - 1} of 8 left in October. If something urgent has come up, message Kyle first.</span></div>
      <button className="pill-btn dark" onClick={() => router.push('/chat')}>Message Kyle</button>
      <button className="pill-btn" style={{ background: 'var(--coral)', color: '#2a0703' }} onClick={() => setState({ sessionCancelled: true, sessionsLeft: s.sessionsLeft - 1 })}>Cancel anyway · counts as used</button>
      <button className="pill-btn white" onClick={() => setStep('view')}>Keep my session</button>
    </>
  );
  return (
    <>
      <div><span className="eyebrow">PT with Kyle</span><h3 style={{ marginTop: 4 }}>Thursday 22 October</h3></div>
      <div className="group" style={{ '--inset': '68px' } as React.CSSProperties}>
        <div className="optrow"><Li icon="clock" color="var(--sky)" /><span className="t"><b className="num">7:00 – 8:00</b><small>Confirmed by Kyle</small></span></div>
        <button className="optrow" onClick={() => toast('Opens directions in Maps')}><Li icon="pin" color="var(--sky)" /><span className="t"><b>The Studio</b><small>Tap for directions</small></span><Chev /></button>
        <div className="optrow"><Li icon="train" color="var(--mint)" /><span className="t"><b>Lower Body B</b><small>Bring water and trainers</small></span></div>
        <div className="optrow"><Li icon="cal" color="var(--amber)" /><span className="t"><b className="num">{s.sessionsLeft} of 8 sessions left</b><small>October · this one included</small></span></div>
      </div>
      <button className="pill-btn dark" onClick={() => toast('Added to your phone\'s calendar')}><Icon name="cal" /> Add to my calendar</button>
      <button className="pill-btn dark" onClick={() => openSheet('book')}>Ask to move it</button>
      <button className="pill-btn" style={{ background: 'none', color: 'var(--coral)', boxShadow: 'inset 0 0 0 1px rgba(255,107,94,.4)' }} onClick={() => setStep('confirm')}>Cancel session</button>
      <p className="foot">Free to cancel up to 24 hours before. After that it counts as used.</p>
    </>
  );
}

export const freqInfo = (freq: string) => { const f = FREQ.find(x => x[0] === freq) ?? FREQ[0]; return { label: f[1], n: f[2], acc: f[3] }; };

function MomentumSheet() {
  const s = useClient(), f = freqInfo(s.onb.freq), router = useRouter();
  const week: [string, number, string][] = [['M', 70, 'on'], ['T', 78, 'on'], ['W', 84, 'now'], ['T', 0, ''], ['F', 0, ''], ['S', 0, ''], ['S', 0, '']];
  return (
    <>
      <div className="mom-big">
        <div className="wrap"><MomentumRings size={184} stroke={14} /><div className="c"><Icon name="bolt" size={30} style={{ color: 'var(--fg)' }} /></div></div>
        <div><b className="word" style={{ font: '800 30px var(--display)', color: 'var(--mint)', letterSpacing: '-.02em' }}>Strong</b><div className="eyebrow" style={{ marginTop: 2 }}>Week 6 of 8</div></div>
        <p>One more workout closes your rings this week.</p>
      </div>
      <div className="contrib group">{MOMENTUM.map(m => (
        <div className="crow" key={m.k}><span className="li" style={{ '--k': m.col } as React.CSSProperties}><Icon name={m.icon} /></span>
          <span><b>{m.k}</b><small>{m.val}</small><div className="bar"><i style={{ width: `${Math.round(m.pct * 100)}%`, background: m.col }} /></div></span>
          <span className="st" style={{ background: m.st[1], color: m.st[2] }}>{m.st[0]}</span></div>
      ))}</div>
      <div><div className="eyebrow" style={{ marginBottom: 10 }}>This week</div>
        <div className="trend">{week.map(([d, v, c], i) => <div key={i} className={c}><i style={{ height: Math.round((v || 8) * 0.85) }} />{d}</div>)}</div></div>
      <div className="preview"><span className="acc"><AccBars n={f.n} /></span><span><b>Accuracy: {f.acc}</b><small>From your workouts, meals and {f.label.toLowerCase()} check-ins. Your coach sees the same view.</small></span></div>
      <button className="pill-btn white" onClick={() => router.push('/progress')}>See all progress</button>
    </>
  );
}

function TimeSheet() {
  const s = useClient(), full = planFor(999).items, fit = planFor(s.duration).items;
  return (
    <>
      <h3>How long have you got?</h3>
      <div className="durs">{[30, 45, 60, 90].map(m => (
        <button key={m} className="dur" aria-pressed={s.duration === m} onClick={() => setState({ duration: m, idx: 0 })}><b className="num">{m}</b><small>min</small></button>
      ))}</div>
      <div className="cutlist">{full.map(f => { const k = fit.find(x => x.ex.id === f.ex.id);
        return <div key={f.ex.id} className={!k ? 'cut' : k.sets < f.sets ? 'trim' : ''}>{f.ex.name}<span className="num">{k ? `${k.sets} sets` : 'skipped'}</span></div>; })}</div>
      <Done />
    </>
  );
}

function SwapSheet() {
  const s = useClient(), { closeSheet, toast } = useUI(), router = useRouter();
  const ex = planFor(s.duration).items[s.idx]?.ex;
  if (!ex || !ex.alts.length) return <><div><h3>No swaps yet</h3><div className="sub">Skip this one or ask your coach.</div></div><button className="pill-btn dark" onClick={() => router.push('/kai')}>Ask KAI</button></>;
  return (
    <>
      <div><h3>Swap {ex.name}</h3><div className="sub">Your coach&apos;s approved options · today only</div></div>
      <div className="opts">{ex.alts.map(([n, w, k]) => (
        <button key={n} className="opt" onClick={() => { setState({ swaps: { ...s.swaps, [ex.id]: n } }); closeSheet(); toast(`Swapped to ${n}`); }}>
          <span className="tile"><Icon name={k} /></span><span><b>{n}</b><span>{w}</span></span></button>
      ))}</div>
    </>
  );
}

function PainSheet() {
  const s = useClient(), p = s.pain, { closeSheet } = useUI();
  const set = (patch: Partial<typeof p>) => setState({ pain: { ...p, ...patch } });
  if (p.sent) return <><Sent title="Your coach has been told">If it&apos;s sharp or sudden, stop and get it checked.</Sent>
    <button className="pill-btn white" onClick={closeSheet}>{p.act === 'swap' ? 'Choose a swap' : 'Done'}</button></>;
  const ready = p.area && p.act;
  return (
    <>
      <h3>Where does it hurt?</h3>
      <div className="areas">{['Knee', 'Lower back', 'Hip', 'Shoulder', 'Ankle', 'Other'].map(a => <button key={a} className="area" aria-pressed={p.area === a} onClick={() => set({ area: a })}>{a}</button>)}</div>
      <div className="sev"><div className="big"><b className="num">{p.sev}</b><span>out of 10</span></div>
        <input type="range" min={0} max={10} value={p.sev} aria-label="Pain level" onChange={e => set({ sev: +e.target.value })} /></div>
      <div className="tri">
        {([['swap', 'swap', 'Swap it'], ['skip', 'skip', 'Skip it'], ['stop', 'stop', 'Stop today']] as const).map(([k, i, l]) => (
          <button key={k} aria-pressed={p.act === k} onClick={() => set({ act: k })}><Icon name={i} />{l}</button>
        ))}
      </div>
      <button className={`pill-btn ${ready ? 'mint' : 'dark'}`} disabled={!ready} style={ready ? undefined : { opacity: .5 }} onClick={() => set({ sent: true })}>Send to your coach</button>
    </>
  );
}

function AddFoodSheet() {
  const s = useClient(), { sheetArg, closeSheet, toast } = useUI();
  const slot = (sheetArg ?? 'Breakfast') as Slot;
  const [tab, setTab] = useState<'search' | 'scan' | 'recipes' | 'quick'>('search');
  const [q, setQ] = useState('');
  const [quick, setQuick] = useState({ kcal: '', P: '', C: '', F: '' });
  const add = (id: string) => { setState({ log: { ...s.log, [slot]: [...s.log[slot], id] } }); toast(`Added to ${slot}`); closeSheet(); };
  const list = FOODS.filter(f => (tab === 'recipes' ? f.img : true) && f.n.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div><h3>Add to {slot}</h3></div>
      <div className="tabs4">{([['search', 'Search'], ['scan', 'Scan'], ['recipes', 'Recipes'], ['quick', 'Quick add']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {(tab === 'search' || tab === 'recipes') && (
        <>
          {tab === 'search' && <label className="search"><Icon name="search" /><input placeholder="Search foods" value={q} onChange={e => setQ(e.target.value)} aria-label="Search foods" /></label>}
          <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>
            {list.length ? list.map(f => (
              <div className="food" key={f.id}>{f.img && <img src={`/assets/${f.img}.jpg`} alt="" />}<span className="t"><b>{f.n}</b><small className="num">{f.p} · {f.kcal} kcal · P {f.P} C {f.C} F {f.F}</small></span>
                <button className="addbtn" onClick={() => add(f.id)} aria-label={`Add ${f.n}`}><Icon name="plus" /></button></div>
            )) : <div className="empty">No matches. Try Quick add to enter the numbers yourself.</div>}
          </div>
        </>
      )}
      {tab === 'scan' && <div className="scanbox"><span>Point the camera at a barcode<br /><small style={{ color: 'var(--fg3)' }}>Uses your phone&apos;s camera in the installed app</small></span></div>}
      {tab === 'quick' && (
        <>
          <div className="qa">{([['kcal', 'Calories', 'kcal'], ['P', 'Protein', 'g'], ['C', 'Carbs', 'g'], ['F', 'Fat', 'g']] as const).map(([k, l, u]) => (
            <label key={k}>{l} ({u})<input inputMode="decimal" placeholder="0" value={quick[k]} onChange={e => setQuick({ ...quick, [k]: e.target.value })} /></label>
          ))}</div>
          <button className="pill-btn mint" onClick={() => {
            const n = (v: string) => parseFloat(v) || 0;
            add(`quick:${n(quick.kcal)}:${n(quick.P)}:${n(quick.C)}:${n(quick.F)}`);
          }}>Add to {slot}</button>
        </>
      )}
    </>
  );
}

// Foods logged with Quick add are stored as "quick:kcal:P:C:F".
export function resolveFood(id: string): Food | undefined {
  if (!id.startsWith('quick:')) return FOODS.find(f => f.id === id);
  const [, kcal, P, C, F] = id.split(':').map(Number);
  return { id, n: 'Quick add', p: 'Entered by you', kcal, P, C, F };
}
