-- =============================================================
-- Lot 5 hardening — Inscription garage
-- =============================================================
-- Objectifs :
--   1. Garantir 1 garage max par user_id (anti-doublon)
--   2. Restreindre l'INSERT aux users dont role = 'garage' (admin exempté)
--   3. Supprimer la policy DELETE (admin only via service_role)
--   4. Conserver la policy SELECT existante (filtrage suspended + owner + admin)
--   5. Grants explicites alignés sur les policies RLS
--
-- État DB avant migration (constaté) :
--   - garages: insert      (user_id=auth.uid() OR admin)            ← trop large
--   - garages: lecture     (NOT suspended OR owner OR admin)        ← OK, à garder
--   - garages: mise à jour (owner OR admin)                          ← à renommer
--   - garages: suppression (owner OR admin)                          ← à supprimer
-- =============================================================

-- 1) UNIQUE (user_id) — empêche les doublons en cas de double submit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'garages_user_unique'
      AND conrelid = 'public.garages'::regclass
  ) THEN
    ALTER TABLE public.garages
      ADD CONSTRAINT garages_user_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2) DROP des policies INSERT / UPDATE / DELETE (on garde "garages: lecture")
DROP POLICY IF EXISTS "garages: insert"       ON public.garages;
DROP POLICY IF EXISTS "garages: mise à jour"  ON public.garages;
DROP POLICY IF EXISTS "garages: suppression"  ON public.garages;
-- Anciens noms éventuels (init schemas variants) :
DROP POLICY IF EXISTS "garages: propriétaire gère"               ON public.garages;
DROP POLICY IF EXISTS "garages: insertion propriétaire garagiste" ON public.garages;
DROP POLICY IF EXISTS "garages: maj propriétaire"                ON public.garages;

-- INSERT : un user role='garage' crée SON propre garage. Admin exempté.
CREATE POLICY "garages: insertion propriétaire garagiste"
  ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      user_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = (SELECT auth.uid()) AND u.role = 'garage'
      )
    )
    OR (SELECT private.is_admin())
  );

-- UPDATE : propriétaire ou admin
CREATE POLICY "garages: maj propriétaire"
  ON public.garages
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

-- Pas de policy DELETE pour authenticated : la suppression d'un garage
-- doit passer par un admin via service_role (intégrité quotes/messages/invoices).

-- 3) Grants explicites alignés avec les policies (CLAUDE.md §RLS + grants)
GRANT SELECT, INSERT, UPDATE ON public.garages TO authenticated;
REVOKE DELETE ON public.garages FROM authenticated;
