'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Li, Ring } from '@/components/client/ui';
import { portionLabel, resolveFood, scaled, totals } from '@/lib/client/food';
import { MACROS, SLOTS, TARGET } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

const r0 = Math.round;

// What the client sees depends on what Kyle has chosen for them: calories and
// macros, protein only, or no numbers at all (just log what you eat).
export default function Fuel() {
  const s = useClient(), { openSheet } = useUI(), mode = s.fuelMode;
  const [day, setDay] = useState(2);
  const t = totals(s.log), left = TARGET.kcal - t.kcal;
  const days: [string, number][] = [['M', 19], ['T', 20], ['W', 21], ['T', 22], ['F', 23], ['S', 24], ['S', 25]];
  return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">Nutrition</div><h1>Fuel</h1></div>
      <div className="days7">{days.map(([d, n], i) => <button key={i} className={day === i ? 'on' : ''} onClick={() => setDay(i)} aria-label={`${d} ${n}`}>{d}<b className="num">{n}</b><i className={i < 3 ? '' : 'none'} /></button>)}</div>
      {mode === 'full' && (
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
      )}
      {mode === 'protein' && (
        <div className="card fsum">
          <svg viewBox="0 0 132 132" width="132" height="132" aria-label={`${r0(t.P)} of ${TARGET.P} grams of protein`}>
            <Ring size={132} stroke={12} pct={t.P / TARGET.P} color="var(--amber)" />
            <text x="66" y="64" textAnchor="middle" fill="var(--fg)" fontFamily="Montserrat" fontWeight="800" fontSize="26">{r0(t.P)}g</text>
            <text x="66" y="84" textAnchor="middle" fill="var(--fg3)" fontFamily="Poppins" fontSize="11">of {TARGET.P}g protein</text>
          </svg>
          <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 15 }}>Kyle&apos;s asked you to focus on protein. Aim for a palm-sized portion at every meal.</p>
        </div>
      )}
      {SLOTS.map(sl => { const list = s.log[sl]; const kc = list.reduce((a, it) => a + (resolveFood(it.food)?.kcal ?? 0) * it.qty, 0); return (
        <div className="group" style={{ '--inset': '14px' } as React.CSSProperties} key={sl}>
          <div className="slot-head"><b>{sl}</b><span className="num">{mode === 'full' && kc ? `${r0(kc)} kcal` : ''}</span><button className="addbtn" onClick={() => openSheet('addfood', sl)} aria-label={`Add food to ${sl}`}><Icon name="plus" /></button></div>
          {list.length ? list.map((it, i) => { const f = resolveFood(it.food); if (!f) return null; const x = scaled(f, it.qty); return (
            <button className="food" key={i} onClick={() => openSheet('editfood', `${sl}|${i}`)} aria-label={`${f.n}, change or remove`}>{f.img && <img src={`/assets/${f.img}.jpg`} alt="" />}
              <span className="t"><b>{f.n}</b><small>{portionLabel(f, it.qty)}</small></span>
              {mode !== 'simple' && <span className="kc num">{mode === 'full' ? r0(x.kcal) : `${r0(x.P)}g`}<small>{mode === 'full' ? `${r0(x.P)}g protein` : 'protein'}</small></span>}</button>
          ); }) : <div className="empty">Nothing yet</div>}
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
