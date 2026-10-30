// The Vercel–Supabase integration adds the anon key; newer projects also have
// a publishable key. Either works in the browser: row-level security decides
// what each user can read.
const key = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, k = key();
  if (!url || !k) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).');
  }
  return { url, key: k };
}

export const hasSupabaseEnv = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && key());
