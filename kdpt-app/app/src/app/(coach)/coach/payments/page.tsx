'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Avatar, Head, Modal, Sec, Tag, Tile } from '@/components/coach/ui';
import { BILLING, PACKAGES, PARTNER, byId, gbp, pkgById, type Tint } from '@/lib/coach/sample-data';

type Change = { price: number; scope: 'new' | 'all'; from: string | null };
type Adj = { kind: 'discount'; value: number; unit: string; len: string; reason: string } | { kind: 'price'; value: number; from: string };
const STATUS: Record<string, [Tint, string]> = { paid: ['mint', 'Paid'], due: ['grey', 'Due 1 Nov'], overdue: ['coral', 'Overdue 5 days'] };

// Every price, rise and discount is set here. A package price change reaches
// existing clients only when Kyle chooses, with 30 days' notice.
export default function Payments() {
  const toast = useToast();
  const [changes, setChanges] = useState<Record<string, Change>>({});
  const [adj, setAdj] = useState<Record<string, Adj>>({});
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [priceFor, setPriceFor] = useState<string | null>(null);
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const tot = (st?: string) => BILLING.filter(b => !st || b[3] === st).reduce((a, b) => a + (b[2] ?? 0), 0);
  const Kpi = ({ n, label, icon, c }: { n: string; label: string; icon: string; c: Tint }) => <div className="card kpi"><Tile icon={icon} c={c} /><span><b className="num">{n}</b><small>{label}</small></span></div>;
  const adjNote = (id: string, price: number | null) => {
    const a = adj[id]; if (!a || price == null) return null;
    if (a.kind === 'discount') { const off = a.unit === '%' ? Math.round(price * a.value / 100) : a.value;
      return <small style={{ color: 'var(--mint)' }}>{a.unit === '%' ? a.value + '%' : gbp(a.value)} off · {a.len} → {gbp(price - off)}{a.reason ? ' · ' + a.reason : ''}</small>; }
    return <small style={{ color: 'var(--amber)' }}>→ {gbp(a.value)} from {a.from}{a.value > price ? ' · notice sent' : ''}</small>;
  };
  return (
    <>
      <Head title="Payments" sub="Cards are charged through Stripe on the 1st. Every price, rise and discount is set here, and nothing changes for a client unless you change it." />
      <div className="kpis"><Kpi n={gbp(tot())} label="Expected for November" icon="card" c="grey" /><Kpi n={gbp(tot('paid'))} label="Paid" icon="check" c="mint" />
        <Kpi n={gbp(tot('due'))} label="Due on the 1st" icon="clock" c="sky" /><Kpi n={gbp(tot('overdue'))} label="Overdue" icon="pain" c="coral" /></div>
      <div><Sec title="Packages" right="Changing a price never surprises anyone: you choose who it applies to" />
        <div className="pkgs">{PACKAGES.map(p => { const on = BILLING.filter(b => b[1] === p.id), legacy = on.filter(b => b[2] !== p.price).length, ch = changes[p.id];
          const shown = ch && ch.scope === 'new' ? ch.price : p.price; return (
          <div className="card pkg" key={p.id}><span className="eyebrow">{p.sub}</span><b style={{ fontWeight: 600 }}>{p.name}</b>
            <span className="price num">{shown == null ? 'Not set' : gbp(shown)}<small>{p.duo ? '/ month for both' : '/ month'}</small></span>
            <span className="note">{on.length} client{on.length === 1 ? '' : 's'}{legacy > 0 && !p.duo && <> · <span style={{ color: 'var(--amber)' }}>{legacy} on an older price</span></>}</span>
            {ch && <Tag c={ch.scope === 'new' ? 'mint' : 'amber'}>{ch.scope === 'new' ? `New clients only · existing stay on ${p.price == null ? 'no price' : gbp(p.price)}` : `Everyone to ${gbp(ch.price)} from ${ch.from} · ${on.length} notified`}</Tag>}
            <button className="btn line" style={{ justifySelf: 'start' }} onClick={() => setPriceFor(p.id)}>{p.price == null && !ch ? 'Set price' : 'Change price'}</button></div>
        ); })}</div></div>
      <div><Sec title="November" right="Each client keeps the price they signed up at until you move them" />
        <div className="card btable">
          <div className="br th"><span>Client</span><span>Package</span><span>They pay</span><span>Status</span><span>Card</span><span /></div>
          {BILLING.map(([id, pk, price, st, card]) => { const c = byId(id), p = pkgById(pk), ch = changes[pk]; const [col, lab] = STATUS[st]; return (
            <div className="br" key={id}>
              <span className="nm"><Avatar c={c} size={32} /><b style={{ fontWeight: 600 }}>{c.name}</b></span>
              <span>{p.name}</span>
              <span className="num">{p.duo ? <><b>{ch ? gbp(ch.price / 2) + ' each' : 'Price not set'}</b><small>Shared with {PARTNER[id]} · split 50/50</small></> : <b>{gbp(price!)}</b>}
                {!p.duo && price !== p.price && <small style={{ color: 'var(--amber)' }}>Older price · current {gbp(p.price!)}</small>}
                {ch && ch.scope === 'all' && ch.price !== price && !p.duo && <small style={{ color: 'var(--amber)' }}>→ {gbp(ch.price)} from {ch.from}</small>}
                {adjNote(id, price)}</span>
              <span><Tag c={col}>{lab}</Tag></span>
              <span style={{ color: 'var(--fg2)' }}>{card}</span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{st === 'overdue' && (reminded[id] ? <Tag c="mint" icon="check">Reminder sent</Tag>
                : <button className="btn ghost" onClick={() => { setReminded({ ...reminded, [id]: true }); toast('Reminder sent with a payment link'); }}>Remind</button>)}
                <button className="btn line" onClick={() => setAdjustFor(id)}>Adjust</button></span>
            </div>
          ); })}
        </div></div>
      {priceFor && <PriceModal pkg={priceFor} onClose={() => setPriceFor(null)} onSave={c => { setChanges({ ...changes, [priceFor]: c }); setPriceFor(null); toast(c.scope === 'new' ? 'Saved · new clients see the new price' : 'Saved · clients notified with 30 days\' notice'); }} />}
      {adjustFor && <AdjustModal client={adjustFor} onClose={() => setAdjustFor(null)} onSave={a => { setAdj({ ...adj, [adjustFor]: a }); setAdjustFor(null); toast('Saved · Stripe updated for this client'); }} />}
    </>
  );
}

function PriceModal({ pkg, onClose, onSave }: { pkg: string; onClose: () => void; onSave: (c: Change) => void }) {
  const toast = useToast(), p = pkgById(pkg);
  const [price, setPrice] = useState(p.price == null ? '' : String(p.price));
  const [scope, setScope] = useState<'new' | 'all'>('new');
  const [from, setFrom] = useState('1 January 2027');
  return (
    <Modal title={`Change price · ${p.name}`} onClose={onClose}>
      <div className="fields"><label className="full">{p.duo ? 'Monthly price for both (£)' : 'New monthly price (£)'}<input inputMode="numeric" value={price} placeholder="e.g. 360" onChange={e => setPrice(e.target.value)} /></label></div>
      <div className="scope">
        <button className={scope === 'new' ? 'on' : ''} onClick={() => setScope('new')}><b>New clients only</b><small>Everyone already on {p.name} keeps paying what they pay now.</small></button>
        <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}><b>Everyone on this package</b><small>From the date below. Clients get a notification and email today, giving at least 30 days&apos; notice.</small></button>
      </div>
      {scope === 'all' && <div className="fields"><label className="full">Starts<select value={from} onChange={e => setFrom(e.target.value)}>{['1 December 2026', '1 January 2027', '1 February 2027'].map(o => <option key={o}>{o}</option>)}</select></label></div>}
      <button className="btn mint" style={{ justifySelf: 'start' }} onClick={() => { const n = parseInt(price, 10); if (!(n > 0)) { toast('Enter a price in pounds'); return; } onSave({ price: n, scope, from: scope === 'all' ? from.replace(/ 20\d\d$/, '') : null }); }}><Icon name="check" className="sm" />Save price</button>
    </Modal>
  );
}

function AdjustModal({ client, onClose, onSave }: { client: string; onClose: () => void; onSave: (a: Adj) => void }) {
  const toast = useToast(), c = byId(client), row = BILLING.find(b => b[0] === client)!;
  const [kind, setKind] = useState<'discount' | 'price'>('discount');
  const [f, setF] = useState({ value: '10', unit: '%', len: 'November only', reason: '', price: row[2] == null ? '' : String(row[2]), from: '1 December' });
  return (
    <Modal title={`Adjust · ${c.name}`} onClose={onClose}>
      <span style={{ color: 'var(--fg3)' }}>{pkgById(row[1]).name} · pays {row[2] == null ? 'a share of the duo price' : gbp(row[2]) + ' a month'}. Only {c.name.split(' ')[0]} is affected.</span>
      <div className="scope">
        <button className={kind === 'discount' ? 'on' : ''} onClick={() => setKind('discount')}><b>Discount</b><small>Money or percentage off, for a set time or until you stop it.</small></button>
        <button className={kind === 'price' ? 'on' : ''} onClick={() => setKind('price')}><b>Change their monthly price</b><small>A rise or a drop just for this client. Rises give 30 days&apos; notice.</small></button>
      </div>
      {kind === 'discount' ? (
        <div className="fields">
          <label>Amount<input inputMode="numeric" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} /></label>
          <label>Type<select value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}><option value="%">% off</option><option value="£">£ off</option></select></label>
          <label>For<select value={f.len} onChange={e => setF({ ...f, len: e.target.value })}>{['November only', '3 months', 'Until I stop it'].map(o => <option key={o}>{o}</option>)}</select></label>
          <label>Reason (only you see this)<input value={f.reason} placeholder="e.g. Loyalty, referral" onChange={e => setF({ ...f, reason: e.target.value })} /></label></div>
      ) : (
        <div className="fields"><label>New monthly price (£)<input inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></label>
          <label>From<select value={f.from} onChange={e => setF({ ...f, from: e.target.value })}>{['1 December', '1 January', '1 February'].map(o => <option key={o}>{o}</option>)}</select></label></div>
      )}
      <button className="btn mint" style={{ justifySelf: 'start' }} onClick={() => {
        const v = parseFloat(kind === 'discount' ? f.value : f.price);
        if (!(v > 0)) { toast('Enter an amount'); return; }
        onSave(kind === 'discount' ? { kind, value: v, unit: f.unit, len: f.len, reason: f.reason.trim() } : { kind, value: v, from: f.from });
      }}><Icon name="check" className="sm" />Save</button>
    </Modal>
  );
}
