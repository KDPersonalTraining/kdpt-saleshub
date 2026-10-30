import { hasSupabaseEnv } from './supabase/env';
import type { Role } from './auth/roles';

// Demo mode runs the whole app on sample data, with no database, and sign-in
// becomes "pick who to be". It stays on until KDPT_LIVE=1 is set, so
// connecting Supabase (which adds its settings automatically) doesn't switch
// clients onto an empty database before it's ready.
export const isDemo = () => process.env.KDPT_LIVE !== '1' || !hasSupabaseEnv();

export const DEMO_COOKIE = 'kdpt_demo';
export type DemoPersona = 'client' | 'new_client' | 'coach';

export const DEMO_PEOPLE: Record<DemoPersona, { id: string; role: Role; name: string }> = {
  client: { id: 'demo-sarah', role: 'client', name: 'Sarah Mitchell' },
  new_client: { id: 'demo-hannah', role: 'client', name: 'Hannah Price' },
  coach: { id: 'demo-kyle', role: 'coach', name: 'Kyle' },
};

export const isPersona = (v: string | undefined): v is DemoPersona => v === 'client' || v === 'new_client' || v === 'coach';
