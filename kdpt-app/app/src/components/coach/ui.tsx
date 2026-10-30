'use client';

import { Icon } from '@/components/icon';
import { tint, type Client, type Tint } from '@/lib/coach/sample-data';

export const Tile = ({ icon, c, style }: { icon: string; c: Tint; style?: React.CSSProperties }) => (
  <span className="tile solid" style={{ color: tint(c)[1], ...style }}><Icon name={icon} /></span>
);
export const Avatar = ({ c, size }: { c: Client; size?: number }) => (
  <span className="av" style={{ background: `hsl(${c.hue} 30% 18%)`, color: `hsl(${c.hue} 70% 72%)`, ...(size ? { width: size, height: size, fontSize: size < 34 ? 11 : undefined } : {}) }}>{c.ini}</span>
);
export const Tag = ({ c, icon, children, style }: { c: Tint; icon?: string; children: React.ReactNode; style?: React.CSSProperties }) => {
  const [bg, fg] = tint(c);
  return <span className="tag" style={{ background: bg, color: fg, ...style }}>{icon && <Icon name={icon} className="sm" />}{children}</span>;
};
export const Switch = ({ on, onChange, label, text }: { on: boolean; onChange: () => void; label: string; text?: string }) => (
  <span className="switch">{text && <span className="muted">{text}</span>}<button role="switch" aria-checked={on} aria-label={label} onClick={onChange} /></span>
);
export const Head = ({ title, sub, eyebrow, children }: { title: React.ReactNode; sub?: React.ReactNode; eyebrow?: string; children?: React.ReactNode }) => (
  <div className="head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children}</div>
);
export const Sec = ({ title, right, style }: { title: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="sec" style={style}><h2>{title}</h2>{typeof right === 'string' ? <span className="muted">{right}</span> : right}</div>
);
export function Modal({ title, onClose, wide, children }: { title?: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        {title !== undefined && <div className="sec" style={{ margin: 0 }}><h2>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>}
        {children}
      </div>
    </div>
  );
}
export const Btn = ({ kind = 'line', icon, children, ...rest }: { kind?: 'mint' | 'white' | 'ghost' | 'line' | 'violet'; icon?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`btn ${kind}`} {...rest}>{icon && <Icon name={icon} className="sm" />}{children}</button>
);
