import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Factory partagée pour créer un client Supabase typé.
// Mobile (Expo) et Web (Next.js) l'utilisent avec leurs propres variables d'env.

export interface CreateSupabaseOptions {
  url: string;
  anonKey: string;
  // Storage personnalisé (ex: AsyncStorage côté mobile).
  storage?: unknown;
}

export function createSupabaseClient(
  opts: CreateSupabaseOptions
): SupabaseClient {
  if (!opts.url || !opts.anonKey) {
    throw new Error(
      '[CarLink] URL ou clé Supabase manquante. Vérifie tes variables d\'environnement.'
    );
  }

  return createClient(opts.url, opts.anonKey, {
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage: opts.storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
