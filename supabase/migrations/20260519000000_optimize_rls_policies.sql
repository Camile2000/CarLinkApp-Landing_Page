-- =============================================================
-- Migration : optimisation des policies RLS
-- Corrections :
--   1. auth_rls_initplan  : auth.uid() → (select auth.uid())
--                           private.is_admin() → (select private.is_admin())
--                           private.owns_garage(x) → (select private.owns_garage(x))
--   2. multiple_permissive_policies : fusion des policies permissives
--      redondantes en une seule policy par opération (OR combiné)
-- Date : 2026-05-19
-- =============================================================

-- -------------------------------------------------------------
-- TABLE : users
-- Suppression des 3 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "users: son propre profil" ON public.users;
DROP POLICY IF EXISTS "users: modifier le sien"  ON public.users;
DROP POLICY IF EXISTS "users: admin tout"         ON public.users;

-- SELECT : profil propre OU admin (fusion "son propre profil" + partie SELECT de "admin tout")
CREATE POLICY "users: lecture" ON public.users
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select private.is_admin())
  );

-- UPDATE : utilisateur sur son propre profil OU admin
-- La politique empêche déjà l'escalade de rôle via le trigger prevent_role_escalation.
-- WITH CHECK identique au USING pour ne pas élargir l'accès.
CREATE POLICY "users: mise à jour" ON public.users
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR (select private.is_admin())
  );

-- INSERT : admin uniquement (handle_new_user tourne en SECURITY DEFINER, pas besoin d'un INSERT public)
CREATE POLICY "users: admin insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((select private.is_admin()));

-- DELETE : admin uniquement
CREATE POLICY "users: admin delete" ON public.users
  FOR DELETE TO authenticated
  USING ((select private.is_admin()));

-- -------------------------------------------------------------
-- TABLE : vehicles
-- Suppression de la policy existante
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "vehicles: propriétaire" ON public.vehicles;

-- ALL : propriétaire OU admin — correction initplan uniquement
-- (une seule policy, pas de redondance)
CREATE POLICY "vehicles: propriétaire ou admin" ON public.vehicles
  FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
  );

-- -------------------------------------------------------------
-- TABLE : garages
-- Suppression des 3 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "garages: visibles si actifs"  ON public.garages;
DROP POLICY IF EXISTS "garages: propriétaire gère"   ON public.garages;
DROP POLICY IF EXISTS "garages: admin tout"           ON public.garages;

-- SELECT : garage actif OU propriétaire OU admin
-- (fusion "visibles si actifs" + partie SELECT de "propriétaire gère" + partie SELECT de "admin tout")
CREATE POLICY "garages: lecture" ON public.garages
  FOR SELECT
  USING (
    suspended = false
    OR (select auth.uid()) = user_id
    OR (select private.is_admin())
  );

-- INSERT : propriétaire (user_id doit correspondre) OU admin
CREATE POLICY "garages: insert" ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );

-- UPDATE : propriétaire OU admin
CREATE POLICY "garages: mise à jour" ON public.garages
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );

-- DELETE : propriétaire OU admin
CREATE POLICY "garages: suppression" ON public.garages
  FOR DELETE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );

-- -------------------------------------------------------------
-- TABLE : quote_requests
-- Suppression des 3 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "requests: conducteur ou garage concerné" ON public.quote_requests;
DROP POLICY IF EXISTS "requests: conducteur gère"              ON public.quote_requests;
DROP POLICY IF EXISTS "requests: garage met à jour"            ON public.quote_requests;

-- SELECT : conducteur OU admin OU garage désigné OU tout garage actif si demande sans garage
-- (fusion "conducteur ou garage concerné" + partie SELECT de "conducteur gère")
CREATE POLICY "requests: lecture" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
    OR (select private.owns_garage(garage_id))
    OR (
      garage_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.user_id = (select auth.uid()) AND g.suspended = false
      )
    )
  );

-- INSERT : conducteur crée sa propre demande
CREATE POLICY "requests: insert conducteur" ON public.quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (conductor_id = (select auth.uid()));

-- UPDATE : conducteur OU garage désigné OU admin
-- (fusion "conducteur gère" UPDATE + "garage met à jour" + admin)
CREATE POLICY "requests: mise à jour" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  )
  WITH CHECK (
    conductor_id = (select auth.uid())
    OR (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );

-- DELETE : conducteur sur sa propre demande OU admin
CREATE POLICY "requests: suppression" ON public.quote_requests
  FOR DELETE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- -------------------------------------------------------------
-- TABLE : quotes
-- Suppression des 2 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "quotes: conducteur ou garage" ON public.quotes;
DROP POLICY IF EXISTS "quotes: garage gère"          ON public.quotes;

-- SELECT : admin OU garage propriétaire OU conducteur de la demande associée
CREATE POLICY "quotes: lecture" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    (select private.is_admin())
    OR (select private.owns_garage(garage_id))
    OR EXISTS (
      SELECT 1 FROM public.quote_requests r
      WHERE r.id = request_id AND r.conductor_id = (select auth.uid())
    )
  );

-- INSERT : garage propriétaire OU admin (policies séparées pour éviter multiple_permissive avec SELECT)
CREATE POLICY "quotes: insert garage" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK ((select private.owns_garage(garage_id)) OR (select private.is_admin()));

-- UPDATE : garage propriétaire OU admin
CREATE POLICY "quotes: mise à jour" ON public.quotes
  FOR UPDATE TO authenticated
  USING ((select private.owns_garage(garage_id)) OR (select private.is_admin()))
  WITH CHECK ((select private.owns_garage(garage_id)) OR (select private.is_admin()));

-- DELETE : garage propriétaire OU admin
CREATE POLICY "quotes: suppression garage" ON public.quotes
  FOR DELETE TO authenticated
  USING ((select private.owns_garage(garage_id)) OR (select private.is_admin()));

-- -------------------------------------------------------------
-- TABLE : messages
-- Suppression des 3 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "messages: expéditeur/destinataire"  ON public.messages;
DROP POLICY IF EXISTS "messages: envoi par l'expéditeur"   ON public.messages;
DROP POLICY IF EXISTS "messages: destinataire marque lu"   ON public.messages;

-- SELECT : expéditeur OU destinataire OU admin — correction initplan
CREATE POLICY "messages: lecture" ON public.messages
  FOR SELECT TO authenticated
  USING (
    sender_id    = (select auth.uid())
    OR recipient_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- INSERT : expéditeur envoie son propre message — correction initplan
CREATE POLICY "messages: envoi" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

-- UPDATE : destinataire marque comme lu OU admin
-- (correction initplan ; admin ajouté pour cohérence sans élargissement réel)
CREATE POLICY "messages: mise à jour" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    recipient_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    recipient_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- -------------------------------------------------------------
-- TABLE : reviews
-- Suppression des 3 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "reviews: avis approuvés publics" ON public.reviews;
DROP POLICY IF EXISTS "reviews: conducteur écrit"       ON public.reviews;
DROP POLICY IF EXISTS "reviews: admin modère"           ON public.reviews;

-- SELECT : avis approuvé OU auteur OU admin
-- (fusion "avis approuvés publics" + partie SELECT de "conducteur écrit" + partie SELECT de "admin modère")
CREATE POLICY "reviews: lecture" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    approved = true
    OR conductor_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- INSERT : conducteur crée son propre avis
CREATE POLICY "reviews: insert conducteur" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (conductor_id = (select auth.uid()));

-- UPDATE : auteur modifie le sien OU admin modère
CREATE POLICY "reviews: mise à jour" ON public.reviews
  FOR UPDATE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- DELETE : admin uniquement (suppression hors auteur non accordée)
CREATE POLICY "reviews: suppression admin" ON public.reviews
  FOR DELETE TO authenticated
  USING ((select private.is_admin()));

-- -------------------------------------------------------------
-- TABLE : invoices
-- Suppression des 4 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "invoices: parties concernées" ON public.invoices;
DROP POLICY IF EXISTS "invoices: garage lit"         ON public.invoices;
DROP POLICY IF EXISTS "invoices: garage crée"        ON public.invoices;
DROP POLICY IF EXISTS "invoices: garage modifie"     ON public.invoices;

-- SELECT : admin OU garage propriétaire OU conducteur de la demande associée
-- (fusion "parties concernées" + "garage lit" — la policy "garage lit" est un sous-ensemble)
CREATE POLICY "invoices: lecture" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    (select private.is_admin())
    OR (select private.owns_garage(garage_id))
    OR EXISTS (
      SELECT 1 FROM public.quote_requests r
      WHERE r.id = request_id AND r.conductor_id = (select auth.uid())
    )
  );

-- INSERT : garage propriétaire uniquement (audit trail — pas d'admin insert direct)
CREATE POLICY "invoices: insert garage" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK ((select private.owns_garage(garage_id)));

-- UPDATE : garage propriétaire OU admin
CREATE POLICY "invoices: mise à jour" ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );

-- Pas de DELETE policy pour les garages — invoices sont immuables hors admin.
-- L'admin peut utiliser le service_role (server-side) si une suppression exceptionnelle est requise.

-- -------------------------------------------------------------
-- TABLE : notifications
-- Suppression des 2 policies existantes
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "notifications: destinataire lit" ON public.notifications;
DROP POLICY IF EXISTS "notifications: destinataire màj" ON public.notifications;

-- SELECT : destinataire OU admin — correction initplan
CREATE POLICY "notifications: lecture" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select private.is_admin())
  );

-- UPDATE : destinataire marque comme lu OU admin — correction initplan
CREATE POLICY "notifications: mise à jour" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR (select private.is_admin())
  );
