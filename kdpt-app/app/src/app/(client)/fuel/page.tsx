'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { resolveFood } from '@/components/client/sheets';
import { Li, Ring } from '@/components/client/ui';
import { MACROS, SLOTS, TARGET, type Food } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

const r0 = Math.round;

export default function Fuel() {
  const s = useClient(), { openSheet } = useUI();
  const [day, setDay] = useState(2);
  const items = (slot: typeof SLOTS[number]) => s.log[slot].map(resolveFood).filter(Boolean) as Food[];
  const t = { kcal: 0, P: 0, C: 0, F: 0 };
  SLOTS.forEach(sl => items(sl).forEach(f => { t.kcal += f.kcal; t.P += f.P; t.C += f.C; t.F += f.F; }));
  const left = TARGET.kcal - t.kcal;
  const days: [string, number][] = [['M', 19], ['T', 20], ['W', 21], ['T', 22], ['F', 23], ['S', 24], ['S', 25]];
  return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">Nutrition</div><h1>Fuel</h1></div>
      <div className="days7">{days.map(([d, n], i) => <button key={i} className={day === i ? 'on' : ''} onClick={() => setDay(i)}>{d}<b className="num">{n}</b><i className={i < 3 ? '' : 'none'} /></button>)}</div>
      <div className="card fsum">
        <svg viewBox="0 0 132 132" width="132" height="132" aria-label={`${r0(t.kcal)} of ${TARGET.kcal} calories`}>
          <Ring size={132} stroke={12} pct={t.kcal / TARGET.kcal} color="var(--fg)" />
          <text x="66" y="64" textAnchor="middle" fill="var(--fg)" fontFamily="Montserrat" fontWeight="800" fontSize="26">{r0(Math.abs(left)).toLocaleString('en-GB')}</text>
          <text x="66" y="84" textAnchor="middle" fill="var(--fg3)" fontFamily="Poppins" fontSize="11">{left >= 0 ? 'kcal left' : 'kcal over'}</text>
        </svg>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="mrow"><div className="top"><span>Calories</span><b className="num">{r0(t.kcal).toLocaleString('en-GB')} <span>/ {TARGET.kcal.toLocaleString('en-GB')}</span></b></div></div>
          {MACROS.map(([k, l, c]) => (
            <div className="mrow" key={k}><div className="top"><span>{l}</span><b className="num">{r0(t[k])} <span>/ {TARGET[k]} g</span></b></div>
              <div className="mbar"><i style={{ width: `${Math.min(100, t[k] / TARGET[k] * 100)}%`, background: c }} /></div></div>
          ))}
        </div>
      </div>
      {SLOTS.map(sl => { const list = items(sl), kc = list.reduce((a, f) => a + f.kcal, 0); return (
        <div className="group" style={{ '--inset': '14px' } as React.CSSProperties} key={sl}>
          <div className="slot-head"><b>{sl}</b><span className="num">{kc ? `${r0(kc)} kcal` : ''}</span><button className="addbtn" onClick={() => openSheet('addfood', sl)} aria-label={`Add food to ${sl}`}><Icon name="plus" /></button></div>
          {list.length ? list.map((f, i) => (
            <div className="food" key={i}>{f.img && <img src={`/assets/${f.img}.jpg`} alt="" />}<span className="t"><b>{f.n}</b><small>{f.p}</small></span><span className="kc num">{r0(f.kcal)}<small>{r0(f.P)}g protein</small></span></div>
          )) : <div className="empty">Nothing logged yet. Tap + to add food, scan a barcode or pick one of Kyle&apos;s recipes.</div>}
        </div>
      ); })}
      <div className="group"><div className="water"><Li icon="drop" color="var(--sky)" />
        <span className="cups">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < s.water ? 'on' : ''} />)}</span>
        <span className="num" style={{ font: '700 14px var(--display)' }}>{(s.water * 0.25).toFixed(2).replace(/0$/, '')} L</span>
        <button className="addbtn" style={{ color: 'var(--sky)', background: 'rgba(110,198,255,.1)', boxShadow: 'inset 0 0 0 1px rgba(110,198,255,.45)' }} onClick={() => setState({ water: Math.min(10, s.water + 1) })} aria-label="Add a glass"><Icon name="plus" /></button></div></div>
      {!s.preview.fresh && (
        <Link className="card note" href="/chat">
          <img className="mark" src="/kd-mark.png" alt="" />
          <span><small>Kyle · weekly review</small><p>Protein&apos;s up to 128g on average, nice. Dinners are light on veg, so add a side salad or frozen veg.</p></span>
        </Link>
      )}
    </div>
  );
}
