'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { FOODS, FREQ, HOURS, MOMENTUM, NOTIF_TYPES, NOV, hm, type Food, type Slot } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';
import { planFor } from '@/lib/client/workout';
import { useCurrentWorkout, useLive } from '@/lib/client/live';
import { uuid } from '@/lib/client/record';
import { browserClient } from '@/lib/supabase/browser';
import { clampQty, resolveFood, scaled } from '@/lib/client/food';
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
    case 'editfood': return <EditFoodSheet />;
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
  const s = useClient(), fail = s.preview.payFail;
  if (s.paid) return <><Sent bg="var(--amber)" ink="#2a1600" title="Marked as paid">Demo only: no money was taken. Card payments will work once they&apos;re switched on.</Sent><Done /></>;
  return (
    <>
      <div><h3>November payment</h3><div className="sub">{fail ? 'Failed on Sunday 1 November' : 'Due Sunday 1 November'}</div></div>
      {fail && <div className="failbox"><Icon name="pain" /><span><b>Your bank declined this payment.</b> Update your card or try again. Sessions stay booked for 7 days.</span></div>}
      <div className="paycard"><div className="line"><span>8 PT sessions</span><span className="num">£260.00</span></div><div className="line"><span>1–30 November</span><span /></div><div className="line total"><span>Total</span><span className="num">£260.00</span></div></div>
      <p className="foot">Card payments aren&apos;t switched on yet. Pay Kyle the usual way for now.</p>
      <button className="pill-btn mint" onClick={() => setState({ paid: true })}>Try it · demo, no charge</button>
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
  if (s.book.done) return (
    <><div><h3>Your November sessions</h3><div className="sub">Awaiting Kyle. Nothing&apos;s confirmed until he approves it.</div></div>
      <div className="group">{NOV.map(([d, day, t], i) => (
        <div className="optrow" key={i}><span className="datebox sm"><small>{d}</small><b className="num">{day}</b></span>
          <span className="t"><b className="num">{s.book.req[i] ? s.book.req[i] : `${t} · Studio`}</b><small>{s.book.req[i] ? `Change requested from ${t} · awaiting Kyle` : 'Accepted · awaiting Kyle'}</small></span>
          <span className="state await">Awaiting Kyle</span></div>
      ))}</div><Done /></>
  );
  return (
    <>
      <div><h3>Your November sessions</h3><div className="sub">Move any that don&apos;t work. Nothing&apos;s booked until Kyle confirms.</div></div>
      <button className="optrow" style={{ background: 'var(--s2)', borderRadius: 14 }} onClick={() => openSheet('avail')}><Li icon="clock" color="var(--sky)" /><span className="t"><b>My times change each month</b><small>Send Kyle your availability instead</small></span><Chev /></button>
      <div className="group">{NOV.map(([d, day, t], i) => (
        <div className="optrow" key={i}><span className="datebox sm"><small>{d}</small><b className="num">{day}</b></span>
          <span className="t"><b className="num">{t} · Studio · 60 min</b><small>{s.book.req[i] ? <span style={{ color: 'var(--amber)' }}>Change to {s.book.req[i]} · not sent yet</span> : 'Proposed by Kyle'}</small></span>
          <button className="add" style={{ color: 'var(--sky)' }} onClick={() => setPick(i)}>{s.book.req[i] ? 'Change' : 'Move'}</button></div>
      ))}</div>
      <p className="foot">Free to change up to 24 hours before. Later cancellations count as used.</p>
      <button className="pill-btn mint" onClick={() => setState({ book: { ...s.book, done: true } })}>{reqs ? `Accept the rest · request ${reqs} change${reqs > 1 ? 's' : ''}` : 'Accept all 8'}</button>
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
  const s = useClient(), { closeSheet, toast } = useUI(), router = useRouter(), w = useCurrentWorkout(s);
  const ex = w ? planFor(s.duration, w).items[s.idx]?.ex : undefined;
  if (!ex || !ex.alts.length) return <><div><h3>No swaps yet</h3><div className="sub">Skip this one or ask your coach.</div></div><button className="pill-btn dark" onClick={() => router.push('/kai')}>Ask KAI</button></>;
  return (
    <>
      <div><h3>Swap {ex.name}</h3><div className="sub">Same movement, so it works the same muscles · today only</div></div>
      <div className="opts">{ex.alts.map(([n, w, k]) => (
        <button key={n} className="opt" onClick={() => { setState({ swaps: { ...s.swaps, [ex.id]: n } }); closeSheet(); toast(`Swapped to ${n}`); }}>
          <span className="tile"><Icon name={k} /></span><span><b>{n}</b><span>{w}</span></span></button>
      ))}</div>
    </>
  );
}

const ACTION: Record<string, string> = { swap: 'swapped', skip: 'skipped_exercise', stop: 'stopped_session' };
const ACT_WORDS: Record<string, string> = { swap: 'I’m swapping it', skip: 'I’m skipping it', stop: 'I’ve stopped for today' };

function PainSheet() {
  const s = useClient(), p = s.pain, { closeSheet, me, toast } = useUI(), live = useLive(), w = useCurrentWorkout(s);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof p>) => setState({ pain: { ...p, ...patch } });
  // Live: a pain report for Kyle, and a message so it lands in his inbox too.
  const send = async () => {
    const ex = w ? planFor(s.duration, w).items[s.idx]?.ex : undefined;
    const sb = live && browserClient();
    if (sb && live) {
      setBusy(true);
      const exId = ex && (('exerciseId' in ex && (ex as { exerciseId?: string }).exerciseId) || null);
      const { error } = await sb.from('pain_reports').insert({ id: uuid(), org_id: live.orgId, client_id: me.id, exercise_id: exId, body_area: p.area!.toLowerCase(), severity: p.sev, action_taken: ACTION[p.act!] });
      await sb.from('messages').insert({ org_id: live.orgId, client_id: me.id, sender_id: me.id, sender_kind: 'client',
        body: `Pain report: ${p.area}, ${p.sev}/10${ex ? ` during ${s.swaps[ex.id] ?? ex.name}` : ''}. ${ACT_WORDS[p.act!]}.` });
      setBusy(false);
      if (error) { toast('Couldn’t send it. Check your signal, or message Kyle.'); return; }
    }
    set({ sent: true, handled: false });
  };
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
      <button className={`pill-btn ${ready ? 'mint' : 'dark'}`} disabled={!ready || busy} style={ready ? undefined : { opacity: .5 }} onClick={send}>{busy ? 'Sending…' : 'Send to your coach'}</button>
    </>
  );
}

function AddFoodSheet() {
  const s = useClient(), { sheetArg, closeSheet, toast } = useUI();
  const slot = (sheetArg ?? 'Breakfast') as Slot;
  const [tab, setTab] = useState<'recent' | 'search' | 'recipes' | 'quick'>(s.recent.length ? 'recent' : 'search');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<Food | null>(null);
  const [quick, setQuick] = useState({ kcal: '', P: '', C: '', F: '' });
  const add = (food: string, qty: number) => {
    setState({ log: { ...s.log, [slot]: [...s.log[slot], { food, qty }] }, recent: [food, ...s.recent.filter(r => r !== food)].slice(0, 20) });
    toast(`Added to ${slot}`); closeSheet();
  };
  if (pick) return <Portion f={pick} qty={1} slot={slot} onBack={() => setPick(null)} onSave={qty => add(pick.id, qty)} />;
  const recent = s.recent.map(id => FOODS.find(f => f.id === id)).filter(Boolean) as Food[];
  const favs = s.favs.map(id => FOODS.find(f => f.id === id)).filter(Boolean) as Food[];
  const list = tab === 'recent' ? [...favs, ...recent.filter(f => !s.favs.includes(f.id))]
    : FOODS.filter(f => (tab === 'recipes' ? f.img : true) && f.n.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div><h3>Add to {slot}</h3></div>
      <div className="tabs4">{([['recent', 'Recent'], ['search', 'Search'], ['recipes', "Kyle's recipes"], ['quick', 'Quick add']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab !== 'quick' && (
        <>
          {tab === 'search' && <label className="search"><Icon name="search" /><input placeholder="Search foods" value={q} onChange={e => setQ(e.target.value)} aria-label="Search foods" autoFocus /></label>}
          <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>
            {list.length ? list.map(f => (
              <button className="food" key={f.id} onClick={() => setPick(f)}>{f.img && <img src={`/assets/${f.img}.jpg`} alt="" />}
                <span className="t"><b>{s.favs.includes(f.id) && <span style={{ color: 'var(--amber)' }}>★ </span>}{f.n}</b><small className="num">{f.p} · {f.kcal} kcal · {f.P}g protein</small></span>
                <span className="addbtn" aria-hidden="true"><Icon name="plus" /></span></button>
            )) : <div className="empty">{tab === 'recent' ? 'Foods you log show up here.' : 'No matches. Try Quick add.'}</div>}
          </div>
          <p className="foot">Barcode scanning comes once the food database is connected.</p>
        </>
      )}
      {tab === 'quick' && (
        <>
          <div className="qa">{([['kcal', 'Calories', 'kcal'], ['P', 'Protein', 'g'], ['C', 'Carbs', 'g'], ['F', 'Fat', 'g']] as const).map(([k, l, u]) => (
            <label key={k}>{l} ({u})<input inputMode="decimal" placeholder="0" value={quick[k]} onChange={e => setQuick({ ...quick, [k]: e.target.value.replace(/[^\d.]/g, '') })} /></label>
          ))}</div>
          <button className="pill-btn mint" disabled={!(parseFloat(quick.kcal) > 0)} style={parseFloat(quick.kcal) > 0 ? undefined : { opacity: .4 }} onClick={() => {
            const n = (v: string) => Math.min(5000, parseFloat(v) || 0);
            add(`quick:${n(quick.kcal)}:${n(quick.P)}:${n(quick.C)}:${n(quick.F)}`, 1);
          }}>Add to {slot}</button>
        </>
      )}
    </>
  );
}

// Choosing how much: servings, or grams for foods that are weighed.
function Portion({ f, qty: start, slot, onBack, onSave, onRemove }: { f: Food; qty: number; slot: Slot; onBack: () => void; onSave: (qty: number) => void; onRemove?: () => void }) {
  const s = useClient();
  const [qty, setQty] = useState(start);
  const [grams, setGrams] = useState(f.g ? String(Math.round(f.g * start)) : '');
  const fav = s.favs.includes(f.id);
  const x = scaled(f, qty), mode = s.fuelMode;
  const setG = (v: string) => { const t = v.replace(/\D/g, '').slice(0, 4); setGrams(t); if (f.g && +t > 0) setQty(clampQty(+t / f.g)); };
  return (
    <>
      <div className="portion-head">
        <button className="ib" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        <span><h3>{f.n}</h3><div className="sub">{f.p} per serving</div></span>
        {!f.id.startsWith('quick:') && <button className="ib" aria-pressed={fav} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'} style={{ color: fav ? 'var(--amber)' : 'var(--fg3)', fontSize: 20 }}
          onClick={() => setState({ favs: fav ? s.favs.filter(id => id !== f.id) : [f.id, ...s.favs] })}>{fav ? '★' : '☆'}</button>}
      </div>
      <div className="qtyrow">
        <button onClick={() => { const q = clampQty(qty - (qty > 1 ? 0.5 : 0.25)); setQty(q); if (f.g) setGrams(String(Math.round(f.g * q))); }} aria-label="Less">−</button>
        <span><b className="num">{qty}</b><small>serving{qty === 1 ? '' : 's'}</small></span>
        <button onClick={() => { const q = clampQty(qty + (qty >= 1 ? 0.5 : 0.25)); setQty(q); if (f.g) setGrams(String(Math.round(f.g * q))); }} aria-label="More">+</button>
      </div>
      {f.g && <label className="search" style={{ justifyContent: 'space-between' }}><span style={{ color: 'var(--fg2)' }}>Or weigh it</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input inputMode="numeric" value={grams} onChange={e => setG(e.target.value)} aria-label="Grams" style={{ width: 70, textAlign: 'right', fontWeight: 700 }} onFocus={e => e.currentTarget.select()} />g</span></label>}
      {mode !== 'simple' && <div className="macros4 num">
        {mode === 'full' && <span><b>{Math.round(x.kcal)}</b>kcal</span>}
        <span style={{ color: 'var(--amber)' }}><b>{Math.round(x.P)}g</b>protein</span>
        {mode === 'full' && <><span style={{ color: 'var(--sky)' }}><b>{Math.round(x.C)}g</b>carbs</span><span style={{ color: 'var(--violet)' }}><b>{Math.round(x.F)}g</b>fat</span></>}
      </div>}
      <button className="pill-btn mint" onClick={() => onSave(qty)}>{onRemove ? 'Save' : `Add to ${slot}`}</button>
      {onRemove && <button className="pill-btn dark" style={{ color: 'var(--coral)' }} onClick={onRemove}>Remove</button>}
    </>
  );
}

// Tapping something already logged: change how much, or remove it.
function EditFoodSheet() {
  const s = useClient(), { sheetArg, closeSheet } = useUI();
  const [slot, i] = (sheetArg ?? 'Breakfast|0').split('|') as [Slot, string];
  const it = s.log[slot]?.[+i], f = it && resolveFood(it.food);
  if (!it || !f) return <Done />;
  const put = (items: typeof s.log[Slot]) => { setState({ log: { ...s.log, [slot]: items } }); closeSheet(); };
  return <Portion f={f} qty={it.qty} slot={slot} onBack={closeSheet} onSave={qty => put(s.log[slot].map((x, j) => (j === +i ? { ...x, qty } : x)))} onRemove={() => put(s.log[slot].filter((_, j) => j !== +i))} />;
}
