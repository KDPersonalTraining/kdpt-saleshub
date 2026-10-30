'use client';

import Link from 'next/link';
import { Icon } from '@/components/icon';
import { MOMENTUM } from '@/lib/client/sample-data';

// A ring: pct 0..1, drawn clockwise from 12 o'clock.
export function Ring({ size, stroke, pct, color, track = 'var(--s3)' }: { size: number; stroke: number; pct: number; color: string; track?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
  return (
    <>
      <circle cx={h} cy={h} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={h} cy={h} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(Math.max(pct, 0), 1))} transform={`rotate(-90 ${h} ${h})`} />
    </>
  );
}

// Apple-style triple ring: training (outer), fuel, recovery (inner).
export function MomentumRings({ size, stroke, pcts }: { size: number; stroke: number; pcts?: number[] }) {
  const gap = stroke + 3;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" style={{ flex: 'none' }}>
      {MOMENTUM.map((m, i) => (
        <g key={m.k} transform={`translate(${i * gap} ${i * gap})`}><Ring size={size - 2 * i * gap} stroke={stroke} pct={pcts?.[i] ?? m.pct} color={m.col} track={m.tr} /></g>
      ))}
    </svg>
  );
}

// The bordered, tinted icon tile used throughout.
export const Li = ({ icon, color, style }: { icon: string; color: string; style?: React.CSSProperties }) => (
  <span className="li" style={{ color, ...style }}><Icon name={icon} /></span>
);
export const Chev = ({ open }: { open?: boolean }) => <span className="chev" style={open ? { transform: 'rotate(90deg)' } : undefined}><Icon name="right" /></span>;

export const SubTop = ({ title, back, right }: { title: string; back: string; right?: React.ReactNode }) => (
  <div className="ntop"><Link className="ib" href={back} aria-label="Back"><Icon name="back" /></Link><h1>{title}</h1>{right}</div>
);

export const Explain = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="explain" style={style}><Icon name="info" /><span>{children}</span></div>
);

export const Empty = ({ icon, color, title, children, cta }: { icon: string; color: string; title: string; children: React.ReactNode; cta?: React.ReactNode }) => (
  <div className="blank"><Li icon={icon} color={color} /><b>{title}</b><p>{children}</p>{cta}</div>
);

export const Switch = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
  <button className="sw" role="switch" aria-checked={on} aria-label={label} onClick={onChange} />
);

export const Eyebrow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="eyebrow" style={{ marginBottom: 10, ...style }}>{children}</div>
);

export const Sent = ({ icon = 'check', bg, ink, title, children }: { icon?: string; bg?: string; ink?: string; title: string; children: React.ReactNode }) => (
  <div className="sent"><span className="ok" style={bg ? { background: bg, color: ink } : undefined}><Icon name={icon} /></span><h3>{title}</h3><p>{children}</p></div>
);

export const AccBars = ({ n }: { n: number }) => <>{[1, 2, 3].map(i => <i key={i} className={i <= n ? 'on' : ''} />)}</>;

export const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0 });
export const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
