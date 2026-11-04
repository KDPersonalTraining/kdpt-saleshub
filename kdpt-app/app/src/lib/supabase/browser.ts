'use client';

import { createBrowserClient } from '@supabase/ssr';

// The signed-in user's own connection from the browser. Row-level security
// limits it to what that person may see.
let client: ReturnType<typeof createBrowserClient> | null = null;
export function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (client ??= createBrowserClient(url, key));
}
