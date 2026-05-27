/**
 * Validation des variables d'environnement au démarrage.
 * Si une variable requise manque, l'app plante immédiatement avec un message clair
 * plutôt qu'un crash obscur plus tard.
 */

type EnvVar = {
  key: string;
  description: string;
};

function validateEnv(vars: EnvVar[]): void {
  const missing = vars.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    const lines = missing.map(({ key, description }) => `  - ${key}  (${description})`);
    throw new Error(
      `[CarLink] Variables d'environnement manquantes :\n${lines.join('\n')}\n\n` +
      `Copie le fichier .env.example correspondant et remplis les valeurs.`
    );
  }
}

export function validateWebEnv(): void {
  validateEnv([
    { key: 'NEXT_PUBLIC_SUPABASE_URL',      description: 'URL du projet Supabase' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Clé publique anon Supabase' },
  ]);
}

export function validateWebServerEnv(): void {
  validateEnv([
    { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Clé service_role (server-side uniquement)' },
  ]);
}

export function validateMobileEnv(): void {
  validateEnv([
    { key: 'EXPO_PUBLIC_SUPABASE_URL',      description: 'URL du projet Supabase' },
    { key: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', description: 'Clé publique anon Supabase' },
  ]);
}

// Environment variables exports
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
