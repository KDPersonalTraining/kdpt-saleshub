'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { tint, type Tint } from '@/lib/coach/sample-data';
import { SignOutButton } from '@/components/sign-out';

const Ctx = createContext<{ toast: (m: string) => void }>({ toast: () => {} });
export const useToast = () => useContext(Ctx).toast;

// Pages that show real data when demo mode is off. The rest say they're samples.
const LIVE_READY = ['/coach/clients', '/coach/programmes', '/coach/messages', '/coach/checkins'];
// Live counts replace the sample ones: Today = pain reports to see.
const LIVE_COUNT: Record<string, ['today' | 'messages' | 'checkins', Tint]> = { '': ['today', 'coral'], messages: ['messages', 'mint'], checkins: ['checkins', 'violet'] };

const NAV: [string, string, string, number?, Tint?][] = [
  ['', 'Today', 'today', 6, 'coral'], ['clients', 'Clients', 'clients'], ['programmes', 'Programmes', 'programmes'], ['checkins', 'Check-ins', 'checkins'],
  ['schedule', 'Schedule', 'schedule', 3, 'amber'], ['messages', 'Messages', 'messages', 3, 'mint'], ['payments', 'Payments', 'payments', 1, 'coral'],
  ['community', 'Community', 'community'], ['library', 'Library', 'library'], ['automation', 'Automation', 'automation'],
];

export function CoachShell({ me, counts, children }: { me: { name: string; role: string; demo?: boolean }; counts?: { today: number; messages: number; checkins: number }; children: React.ReactNode }) {
  const path = usePathname();
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2600); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  const section = path.split('/')[2] ?? '';
  return (
    <Ctx.Provider value={{ toast }}>
      <div className="shell">
        <aside className="side">
          <div className="logo"><img src="/kd-mark.png" alt="KD" /><span>Coach</span>{me.demo && <span className="demotag">Demo</span>}</div>
          {NAV.map(([k, l, icon, sn, sc]) => { const lc = LIVE_COUNT[k]; const n = me.demo ? sn : lc && counts ? counts[lc[0]] : 0; const c = me.demo ? sc : lc?.[1]; const t = c && tint(c); return (
            <Link key={k} href={`/coach${k ? '/' + k : ''}`} className={`nav ${section === k ? 'on' : ''}`}>
              <Icon name={icon} />{l}{n ? <span className="count" style={{ background: t![0], color: t![1] }}>{n}</span> : null}
            </Link>
          ); })}
          <div className="me" style={{ marginTop: 'auto' }}>
            <img src="/kd-mark.png" alt="" style={{ width: 34, height: 34, borderRadius: '50%', background: '#000', objectFit: 'contain', padding: '8px 5px', border: '1px solid var(--hair)' }} />
            <span style={{ flex: 1 }}><b>{me.name}</b><small>{me.role === 'coach' ? 'Head coach' : 'Assistant coach'}</small></span>
            <SignOutButton className="iconbtn" label={me.demo ? 'Switch person' : 'Log out'}><Icon name="open" className="sm" /></SignOutButton>
          </div>
        </aside>
        <main className="main"><div className="wrap"><div className="fade" style={{ display: 'grid', gap: 24 }}>
          {!me.demo && path !== '/coach' && !LIVE_READY.some(p => path.startsWith(p)) && (
            <div className="flag" style={{ borderColor: 'rgba(255,180,94,.3)', background: 'rgba(255,180,94,.06)' }}><span style={{ color: 'var(--amber)' }}><Icon name="info" /></span>
              <span><b>Sample data.</b> This page isn&apos;t connected to your database yet. Today, Clients, Programmes, Messages and Check-ins are.</span></div>
          )}
          {children}</div></div></main>
      </div>
      {msg && <div className="toast" role="status"><Icon name="check" className="sm" />{msg}</div>}
    </Ctx.Provider>
  );
}
