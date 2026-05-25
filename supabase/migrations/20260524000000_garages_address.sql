-- =============================================================
-- Migration : ajout de la colonne `address` à public.garages
-- =============================================================
-- Contexte :
--   La maquette Showcase v3 prévoit deux champs distincts dans le
--   formulaire d'inscription garage : "Quartier" (neighborhood, déjà
--   présent) et "Adresse" (nouvelle colonne).
--
-- Sécurité :
--   - RLS déjà active sur public.garages (init_schema + hardening).
--   - Les policies INSERT/UPDATE ne discriminent pas par colonne,
--     donc address hérite automatiquement des règles existantes
--     (propriétaire = auth.uid() AND users.role = 'garage', ou admin).
--   - Aucun grant à modifier (GRANT SELECT, INSERT, UPDATE déjà actif).
--   - Pas d'index ajouté : pas de filtre prévu sur address.
-- =============================================================

ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.garages.address IS
  'Adresse postale complète du garage (rue + numéro), saisie au signup.';
