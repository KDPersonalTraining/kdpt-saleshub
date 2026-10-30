'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Avatar, Head, Sec, Switch, Tag, Tile } from '@/components/coach/ui';
import { MODERATION, RECIPES, byId } from '@/lib/coach/sample-data';

export default function Community() {
  const toast = useToast();
  const [clientsPost, setClientsPost] = useState(false);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [d, setD] = useState({ q: 'What\'s your go-to meal when you\'re short on time?', title: 'Plan your protein for the week', body: 'Batch-cook two protein sources on Sunday (chicken thighs and turkey mince work well). It turns most meals into a 10-minute job.', meals: [3, 0, 2], scheduled: false });
  const swapMeal = (i: number) => { const m = d.meals.slice(); let n = m[i]; do { n = (n + 1) % RECIPES.length; } while (m.includes(n)); m[i] = n; setD({ ...d, meals: m, scheduled: false }); };
  const inputStyle: React.CSSProperties = { height: 44, borderRadius: 8, background: 'var(--s1)', border: '1px solid var(--hair)', padding: '0 14px' };
  return (
    <>
      <Head title="Community" sub="Your tip and 3 meals go out every Wednesday at 07:00, the question of the week every Monday. Clients like and comment; only you post for now.">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Switch on={clientsPost} label="Let clients post" text="Let clients post" onChange={() => { setClientsPost(!clientsPost); toast(!clientsPost ? 'Clients can now post to the group' : 'Only you can post'); }} />
          <button className="btn line" onClick={() => toast('Post an announcement now')}><Icon name="megaphone" className="sm" />Announcement</button></div></Head>
      <div className="grid2">
        <section className="card pad" style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Sec style={{ margin: 0 }} title="Week 44 · Wednesday 28 October" right={d.scheduled ? <Tag c="mint" icon="check">Scheduled</Tag> : <Tag c="grey">Draft</Tag>} />
          <label style={{ display: 'grid', gap: 6 }}><span className="eyebrow">Question of the week · Monday 26 Oct</span><input value={d.q} onChange={e => setD({ ...d, q: e.target.value, scheduled: false })} style={{ ...inputStyle, font: '600 15px var(--body)' }} /></label>
          <label style={{ display: 'grid', gap: 6 }}><span className="eyebrow">Tip of the week · Wednesday 28 Oct</span><input value={d.title} onChange={e => setD({ ...d, title: e.target.value, scheduled: false })} style={{ ...inputStyle, font: '700 15px var(--display)' }} /></label>
          <textarea className="fb" style={{ borderColor: 'var(--hair)', minHeight: 90 }} aria-label="Tip text" value={d.body} onChange={e => setD({ ...d, body: e.target.value, scheduled: false })} />
          <div><Sec style={{ marginBottom: 10 }} title={<span className="eyebrow">3 high-protein meals</span>} right="Tap a meal to swap it" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>{d.meals.map((m, i) => { const r = RECIPES[m]; return (
              <button key={i} className="ph" onClick={() => swapMeal(i)} title="Swap meal"><img src={`/assets/${r[0]}.jpg`} alt="" /><span className="react" style={{ background: 'rgba(0,0,0,.55)' }}><Icon name="swap" className="sm" /></span>
                <span className="cap"><b>{r[1]}</b><small style={{ color: 'var(--amber)' }}>{r[2]}g protein</small></span></button>
            ); })}</div></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn mint" onClick={() => { setD({ ...d, scheduled: true }); toast('Scheduled · question Monday, tip and meals Wednesday'); }}><Icon name="check" className="sm" />{d.scheduled ? 'Update' : 'Schedule'}</button>
            <button className="btn violet" onClick={() => setD({ ...d, title: 'Walk after your biggest meal', body: 'A 10-minute walk after dinner helps digestion, adds 1,000+ steps and counts towards the November challenge.', scheduled: false })}><Icon name="spark" className="sm" />KAI draft</button></div>
        </section>
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div><Sec title="Latest in the group" right="Hide anything that shouldn't be there" />
            <div className="card">{MODERATION.map(([id, c, t, w]) => (
              <div key={id} className={`mod ${hidden[id] ? 'hidden' : ''}`}><Avatar c={byId(c)} size={30} /><span><b>{byId(c).name.split(' ')[0]}</b> <small style={{ color: 'var(--fg3)' }}>{w}</small><p>{t}</p></span>
                <span style={{ display: 'flex', gap: 2 }}><button className="iconbtn" onClick={() => toast('Liked')} aria-label="Like"><Icon name="heart" className="sm" /></button>
                  <button className="iconbtn" onClick={() => setHidden({ ...hidden, [id]: !hidden[id] })} aria-label={hidden[id] ? 'Show' : 'Hide'}><Icon name={hidden[id] ? 'open' : 'close'} className="sm" /></button></span></div>
            ))}</div></div>
          <div><Sec title="Last week" right="Week 43" />
            <div className="statrow"><div className="card"><b className="num" style={{ color: 'var(--violet)' }}>29/35</b><small>Opened</small></div><div className="card"><b className="num" style={{ color: 'var(--coral)' }}>23</b><small>Reactions</small></div><div className="card"><b className="num" style={{ color: 'var(--amber)' }}>41</b><small>Meals saved</small></div></div></div>
          <div><Sec title="Announcements" />
            <div className="card">{([['flame', 'amber', 'November challenge: 10k steps', '12 clients joined'], ['megaphone', 'sky', 'Studio closed Monday 3 November', 'Posted Mon 19 Oct']] as const).map(([i, c, t, m]) => (
              <div key={t} className="ev" style={{ padding: '14px 18px' }}><Tile icon={i} c={c} /><span><b>{t}</b><small>{m}</small></span><span /></div>))}</div></div>
          <div><Sec title="Past drops" />
            <div className="card">{[['Week 43', 'Front-load your protein'], ['Week 42', 'Sleep: the free recovery tool'], ['Week 41', 'How to warm up in 5 minutes']].map(([w, t]) => (
              <div key={w} className="ev" style={{ padding: '14px 18px' }}><Tile icon="community" c="violet" /><span><b>{t}</b><small>{w} · tip + 3 meals</small></span><span /></div>))}</div></div>
        </section>
      </div>
    </>
  );
}
