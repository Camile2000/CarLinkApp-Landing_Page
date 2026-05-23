-- =============================================================
-- Lot 5 hardening — Inscription garage
-- =============================================================
-- Objectifs :
--   1. Garantir 1 garage max par user_id (anti-doublon)
--   2. Restreindre l'INSERT aux users dont role = 'garage'
--   3. Séparer les policies pour bloquer le DELETE par le propriétaire
--   4. Grants explicites alignés sur les policies RLS
-- =============================================================

-- 1) UNIQUE (user_id) — empêche les doublons en cas de double submit
ALTER TABLE public.garages
  ADD CONSTRAINT garages_user_unique UNIQUE (user_id);

-- 2) Remplacement de la policy "propriétaire gère" trop large (FOR ALL)
DROP POLICY IF EXISTS "garages: propriétaire gère" ON public.garages;

-- INSERT : seuls les users avec role='garage' peuvent créer leur propre garage
CREATE POLICY "garages: insertion propriétaire garagiste"
  ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'garage'
    )
  );

-- UPDATE : propriétaire uniquement (admin couvert par la policy admin)
CREATE POLICY "garages: maj propriétaire"
  ON public.garages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pas de policy DELETE pour le propriétaire : la suppression d'un garage
-- doit passer par un admin (intégrité des quotes/messages/invoices).

-- 3) Grants explicites alignés avec les policies (CLAUDE.md §RLS + grants)
GRANT SELECT, INSERT, UPDATE ON public.garages TO authenticated;
-- Pas de DELETE pour authenticated (admin uniquement, via service_role).
