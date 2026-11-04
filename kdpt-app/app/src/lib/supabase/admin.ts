import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

// Full-access client for the few things a signed-in user can't do for
// themselves, such as Kyle creating a client's account. Server only: the
// service role key must never reach a browser. Every caller checks that the
// person asking is the coach first.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. The Vercel–Supabase integration adds it.');
  return createClient(supabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
