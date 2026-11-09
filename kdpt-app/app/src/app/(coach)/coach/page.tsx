import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { loadToday } from '@/lib/coach/today';
import { createClient } from '@/lib/supabase/server';
import { DemoToday } from './demo-today';
import { LiveToday } from './live-today';

export default async function TodayPage() {
  if (isDemo()) return <DemoToday />;
  const me = await requireArea('coach');
  return <LiveToday name={me.name} data={await loadToday(await createClient(), me.orgId!)} />;
}
