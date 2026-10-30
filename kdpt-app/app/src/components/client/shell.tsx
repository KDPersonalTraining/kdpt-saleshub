'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { loadStore, setState, useClient } from '@/lib/client/store';
import { Sheet } from './sheets';

export type SheetName = 'pay' | 'book' | 'avail' | 'session' | 'momentum' | 'time' | 'swap' | 'pain' | 'notifset' | 'addfood';
type UI = {
  toast: (m: string) => void;
  sheet: SheetName | null;
  sheetArg: string | null;
  openSheet: (s: SheetName, arg?: string) => void;
  closeSheet: () => void;
  push: (title: string, body: string, sheet: SheetName) => void;
  me: { id: string; name: string; first: string; initials: string; isNew: boolean; demo: boolean };
};
const Ctx = createContext<UI | null>(null);
export const useUI = () => useContext(Ctx)!;

const TABS = [['home', 'Home'], ['train', 'Train'], ['fuel', 'Fuel'], ['progress', 'Progress'], ['community', 'Community']] as const;
// Full-screen flows hide the tab bar.
const NO_TABS = ['/workout', '/chat', '/kai', '/checkin', '/profile', '/welcome'];

export function ClientShell({ me, children }: { me: { id: string; name: string; isNew?: boolean; demo?: boolean }; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const s = useClient();
  const [toastMsg, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [sheetArg, setSheetArg] = useState<string | null>(null);
  const [pushMsg, setPush] = useState<{ title: string; body: string; sheet: SheetName; show: boolean } | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { loadStore(me.id, !!me.isNew); }, [me.id, me.isNew]);
  // New clients go through onboarding first.
  useEffect(() => { if (!s.onb.done && path !== '/welcome') router.replace('/welcome'); }, [s.onb.done, path, router]);
  useEffect(() => { if (screen.current) screen.current.scrollTop = 0; setSheet(null); }, [path]);
  useEffect(() => { if (screen.current) (screen.current.style as CSSStyleDeclaration & { zoom: string }).zoom = String(s.scale); }, [s.scale]);

  const toast = useCallback((m: string) => {
    setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  const openSheet = useCallback((n: SheetName, arg?: string) => {
    if (n === 'pain') setState({ pain: { area: null, sev: 3, act: null, sent: false } });
    setSheetArg(arg ?? null); setSheet(n);
  }, []);
  const pain = useRef(s.pain);
  pain.current = s.pain;
  // After reporting pain with "swap it", go straight to the swap options.
  const closeSheet = useCallback(() => setSheet(cur => (cur === 'pain' && pain.current.sent && pain.current.act === 'swap' ? 'swap' : null)), []);
  const push = useCallback((title: string, body: string, sh: SheetName) => {
    setPush({ title, body, sheet: sh, show: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setPush(p => p && { ...p, show: true })));
    setTimeout(() => setPush(p => p && { ...p, show: false }), 6500);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const parts = me.name.split(' ');
  const ui: UI = { toast, sheet, sheetArg, openSheet, closeSheet, push,
    me: { id: me.id, name: me.name, first: parts[0], initials: parts.map(p => p[0]).join('').slice(0, 2).toUpperCase(), isNew: !!me.isNew, demo: !!me.demo } };
  const tab = path.split('/')[1] || 'home';
  const active = ['workout', 'history', 'library'].includes(tab) ? 'train' : ['chat', 'notifications'].includes(tab) ? 'home' : tab;
  const showTabs = !NO_TABS.some(p => path.startsWith(p));
  const offline = s.preview.offline && path !== '/welcome';

  return (
    <Ctx.Provider value={ui}>
      <div className="device">
        <div className="screen" ref={screen}>
          {offline && (
            <div className="netbar" role="status"><Icon name="wifi" />
              <span><b>You&apos;re offline.</b> {path.startsWith('/workout') ? 'Keep going: your sets are saved on this phone and sync when you\'re back.' : 'Showing what was last saved. Messages send when you reconnect.'}</span>
            </div>
          )}
          {children}
        </div>
        {showTabs && (
          <nav className="tabbar" aria-label="App sections">
            {TABS.map(([k, l]) => (
              <Link key={k} href={`/${k}`} className={k === active ? 'on' : ''} aria-label={l}>
                <Icon name={k} /><span>{l}</span>{k === 'community' && <i className="pip" style={{ background: 'var(--violet)' }} />}
              </Link>
            ))}
          </nav>
        )}
        {sheet && (
          <div className="scrim" onClick={e => { if (e.target === e.currentTarget) closeSheet(); }}>
            <div className="sheet" role="dialog" aria-modal="true"><div className="grab" /><Sheet name={sheet} /></div>
          </div>
        )}
        {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
        {pushMsg && (
          <button className={`push ${pushMsg.show ? 'show' : ''}`} aria-live="polite" onClick={() => { setPush(null); if (path !== '/home') router.push('/home'); openSheet(pushMsg.sheet); }}>
            <img src="/kd-mark.png" alt="" /><span className="t"><span className="row"><span>KDPT</span><span>now</span></span><b>{pushMsg.title}</b><p>{pushMsg.body}</p></span>
          </button>
        )}
      </div>
    </Ctx.Provider>
  );
}
