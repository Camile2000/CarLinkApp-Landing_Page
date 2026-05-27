-- =============================================================
-- Hardening des RPC d'auth pré-inscription/récupération
-- =============================================================
-- Contexte :
-- Le Supabase Security Advisor signale (à juste titre) que les RPC
-- `check_email_status` et `check_email_role` sont des fonctions
-- SECURITY DEFINER exposées via PostgREST aux rôles `anon` et
-- `authenticated`. C'est un risque d'énumération d'emails connu et
-- assumé : ces fonctions ont besoin de SECURITY DEFINER pour lire
-- `auth.users` (table système non exposable) et `public.users`
-- (protégé par RLS qui empêcherait sinon `anon` de répondre).
--
-- Risque accepté :
--   1. Énumération d'email (mitigée par rate limiting frontend +
--      messages neutres dans l'UX forgot-password / signup)
--   2. Pas de bypass de RLS car les fonctions ne renvoient qu'un
--      enum (statut/rôle), jamais de données utilisateur
--
-- Mitigations en place :
--   - search_path forcé à public,pg_temp (anti-shadowing)
--   - STABLE + LANGUAGE sql (pas d'effets de bord)
--   - Frontend affiche un message neutre indépendamment du résultat
--   - Rate limiting côté frontend (debounce + désactivation bouton)
--
-- Référence linter :
--   - 0028_anon_security_definer_function_executable
--   - 0029_authenticated_security_definer_function_executable
-- =============================================================

-- Renforcer search_path (anti-shadowing) sur les deux fonctions
ALTER FUNCTION public.check_email_status(TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_email_role(TEXT)   SET search_path = public, pg_temp;

-- Documenter explicitement le risque accepté pour audit futur
COMMENT ON FUNCTION public.check_email_status(TEXT) IS
  'SECURITY DEFINER nécessaire pour lire auth.users. Risque d''énumération '
  'd''email accepté : mitigé par rate limiting frontend et messages neutres '
  'dans l''UX. Ne retourne qu''un enum (available|pending_verification|verified), '
  'jamais de données utilisateur. Voir Security Advisor warnings 0028/0029.';

COMMENT ON FUNCTION public.check_email_role(TEXT) IS
  'SECURITY DEFINER nécessaire pour bypasser la RLS sur public.users. '
  'Risque d''énumération de rôle accepté : mitigé par rate limiting frontend '
  'et messages neutres dans forgot-password. Ne retourne qu''un text (rôle), '
  'jamais de données utilisateur. Voir Security Advisor warnings 0028/0029.';
