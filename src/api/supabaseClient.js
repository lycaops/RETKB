import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL is not set. Set it in .env.local before starting the app.',
  );
}
if (!anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_ANON_KEY is not set. Set it in .env.local before starting the app.',
  );
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
