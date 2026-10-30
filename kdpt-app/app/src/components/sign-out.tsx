'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/actions';

export function SignOutButton({ className, style, label = 'Log out', children }: { className?: string; style?: React.CSSProperties; label?: string; children?: React.ReactNode }) {
  const [pending, start] = useTransition();
  return (
    <button className={className} style={style} disabled={pending} aria-label={label} title={label}
      onClick={() => start(async () => { await signOut(); window.location.replace('/sign-in'); })}>
      {children ?? label}
    </button>
  );
}
