import { requireArea } from '@/lib/auth/session';
import { CoachShell } from '@/components/coach/shell';
import { coachCounts } from '@/lib/coach/today';
import { createClient } from '@/lib/supabase/server';
import './coach.css';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const me = await requireArea('coach');
  // Live: real counts for the menu (pain reports, unread conversations, check-ins to read).
  const counts = me.demo ? undefined : await coachCounts(await createClient()).catch(() => undefined);
  return <CoachShell me={me} counts={counts}>{children}</CoachShell>;
}
