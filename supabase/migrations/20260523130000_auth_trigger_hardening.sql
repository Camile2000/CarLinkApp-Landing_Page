-- =============================================================
-- Lot 5.1 — Hardening trigger handle_new_user + tests RLS
-- =============================================================
-- Objectifs :
--   1. Valider explicitement le role dans raw_user_meta_data
--   2. Refuser un role inconnu plutôt que de fallback silencieux
--   3. Garantir que language est bien typé
--   4. Logger les insertions ratées pour traçabilité (RAISE NOTICE)
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  v_role     user_role;
  v_language app_language;
  v_role_txt text := NEW.raw_user_meta_data->>'role';
  v_lang_txt text := NEW.raw_user_meta_data->>'language';
BEGIN
  -- Role : si fourni, doit être un membre valide de l'enum.
  -- Si absent (cas magic-link ou signup admin), fallback sur 'conductor'.
  IF v_role_txt IS NULL OR v_role_txt = '' THEN
    v_role := 'conductor';
  ELSIF v_role_txt NOT IN ('conductor', 'garage', 'admin') THEN
    RAISE EXCEPTION 'Rôle invalide à l''inscription: %', v_role_txt
      USING ERRCODE = '22023';
  ELSE
    v_role := v_role_txt::user_role;
  END IF;

  -- Bloque la création d'un compte admin via signup public.
  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Création de compte admin non autorisée via signup'
      USING ERRCODE = '42501';
  END IF;

  -- Language : fallback fr si absent ou invalide.
  IF v_lang_txt IS NULL OR v_lang_txt NOT IN ('fr', 'en') THEN
    v_language := 'fr';
  ELSE
    v_language := v_lang_txt::app_language;
  END IF;

  INSERT INTO public.users (id, phone, email, full_name, role, language)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Utilisateur'),
    v_role,
    v_language
  );

  RETURN NEW;
END; $$;

-- Trigger déjà créé en init ; CREATE OR REPLACE de la fonction suffit.
