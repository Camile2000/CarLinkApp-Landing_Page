-- =============================================================
-- RPC: check_email_status
-- Vérifier le statut d'un email avant inscription/récupération mot de passe
-- Statuts:
--   'available' → email non utilisé
--   'pending_verification' → email inscrit mais non confirmé
--   'verified' → email déjà confirmé/utilisé
-- =============================================================

CREATE OR REPLACE FUNCTION public.check_email_status(p_email TEXT)
  RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public AS $$
  SELECT CASE
    WHEN au.id IS NULL THEN 'available'
    WHEN au.email_confirmed_at IS NULL THEN 'pending_verification'
    ELSE 'verified'
  END
  FROM auth.users au
  WHERE au.email = p_email;
$$;

-- Exposer en RPC accessible aux clients authentifiés et anonymes
GRANT EXECUTE ON FUNCTION public.check_email_status(TEXT) TO anon, authenticated;
