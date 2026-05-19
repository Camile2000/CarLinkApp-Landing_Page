import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase SERVER-SIDE uniquement.
 * Utilise la clé service_role qui bypasse RLS → ne jamais exposer côté client.
 * Réservé aux Server Components, Route Handlers, et Server Actions du dashboard admin.
 */
export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[CarLink] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.\n' +
      'Ce client est réservé au server-side. Vérifie apps/web/.env.local'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
