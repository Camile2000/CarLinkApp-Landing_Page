-- =============================================================
-- Lot 6 - Interventions RLS policies
-- =============================================================
-- Objectif : Implémenter les policies RLS pour la table interventions
--            assurant l'accès correct selon les rôles et propriétés
-- =============================================================

-- SELECT : conducteur voit les interventions de ses devis,
--          garage voit les siennes, admin voit tout
CREATE POLICY "interventions: select conducteur (from quote_requests)"
  ON public.interventions
  FOR SELECT
  TO authenticated
  USING (
    -- Conducteur : voir les interventions de ses propres demandes de devis
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      WHERE qr.id = request_id
        AND qr.user_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_admin())
  );

CREATE POLICY "interventions: select garage (own garage)"
  ON public.interventions
  FOR SELECT
  TO authenticated
  USING (
    -- Garage : voir les interventions de son garage
    garage_id IN (
      SELECT g.id FROM public.garages g
      WHERE g.user_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_admin())
  );

-- INSERT : seul le garage propriétaire ou admin peut créer une intervention
CREATE POLICY "interventions: insert garage or admin"
  ON public.interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      -- Garage : créer une intervention pour son propre garage
      garage_id IN (
        SELECT g.id FROM public.garages g
        WHERE g.user_id = (SELECT auth.uid())
      )
      -- Et vérifier que la demande de devis associée existe
      AND EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = request_id
      )
    )
    OR (SELECT private.is_admin())
  );

-- UPDATE : seul le garage propriétaire ou admin peut mettre à jour
CREATE POLICY "interventions: update garage or admin"
  ON public.interventions
  FOR UPDATE
  TO authenticated
  USING (
    garage_id IN (
      SELECT g.id FROM public.garages g
      WHERE g.user_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_admin())
  )
  WITH CHECK (
    garage_id IN (
      SELECT g.id FROM public.garages g
      WHERE g.user_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_admin())
  );

-- DELETE : admin only
CREATE POLICY "interventions: delete admin only"
  ON public.interventions
  FOR DELETE
  TO authenticated
  USING (SELECT private.is_admin());

-- Grants alignés avec les policies RLS
GRANT SELECT, INSERT, UPDATE ON public.interventions TO authenticated;
REVOKE DELETE ON public.interventions FROM authenticated;
