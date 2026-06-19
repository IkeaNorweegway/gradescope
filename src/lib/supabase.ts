import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

let client: ReturnType<typeof createClient> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): any | null {
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}
