import { hasSupabaseEnv } from './supabase/env';
import type { Role } from './auth/roles';

// Demo mode runs the whole app on sample data, with no database. It switches
// on automatically when the Supabase settings are missing, so the app can be
// tried before Supabase is set up. Sign-in becomes "pick who to be".
export const isDemo = () => !hasSupabaseEnv();

export const DEMO_COOKIE = 'kdpt_demo';
export type DemoPersona = 'client' | 'new_client' | 'coach';

export const DEMO_PEOPLE: Record<DemoPersona, { id: string; role: Role; name: string }> = {
  client: { id: 'demo-sarah', role: 'client', name: 'Sarah Mitchell' },
  new_client: { id: 'demo-hannah', role: 'client', name: 'Hannah Price' },
  coach: { id: 'demo-kyle', role: 'coach', name: 'Kyle' },
};

export const isPersona = (v: string | undefined): v is DemoPersona => v === 'client' || v === 'new_client' || v === 'coach';
