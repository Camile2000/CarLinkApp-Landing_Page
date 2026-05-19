import { createSupabaseClient } from '@carlink/shared';

/**
 * Client Supabase BROWSER (côté client).
 * Clé anon uniquement → soumis aux policies RLS.
 * Utiliser dans les Client Components ('use client').
 * Pour le server-side admin, utiliser supabase-server.ts.
 */
export const supabase = createSupabaseClient({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
});
