import { requireArea } from '@/lib/auth/session';
import { CoachShell } from '@/components/coach/shell';
import './coach.css';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const me = await requireArea('coach');
  return <CoachShell me={me}>{children}</CoachShell>;
}
