-- =============================================================
-- CarLink — Schéma complet de la base de données
-- PostgreSQL / Supabase
-- Migration initiale : création complète du schéma
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================
CREATE TYPE user_role      AS ENUM ('conductor', 'garage', 'admin');
CREATE TYPE app_language    AS ENUM ('fr', 'en');
CREATE TYPE request_urgency AS ENUM ('low', 'medium', 'high');
CREATE TYPE request_status  AS ENUM ('pending', 'quoted', 'accepted', 'in_progress', 'completed', 'declined');
CREATE TYPE payment_status  AS ENUM ('pending', 'paid');

-- =============================================================
-- 1. USERS  (extension de auth.users)
-- =============================================================
CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      text UNIQUE,
  email      text UNIQUE,
  full_name  text,
  role       user_role    NOT NULL DEFAULT 'conductor',
  city       text,
  language   app_language NOT NULL DEFAULT 'fr',
  avatar_url text,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================
-- 2. VEHICLES
-- =============================================================
CREATE TABLE public.vehicles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brand         text NOT NULL,
  model         text NOT NULL,
  year          int,
  license_plate text UNIQUE,
  mileage       int,
  fuel_type     text,
  color         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_user_idx ON public.vehicles(user_id);

-- =============================================================
-- 3. GARAGES
-- =============================================================
CREATE TABLE public.garages (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garage_name        text NOT NULL,
  city               text,
  neighborhood       text,
  latitude           double precision,
  longitude          double precision,
  phone              text,
  specialties        text[]         NOT NULL DEFAULT '{}',
  rating             numeric(2,1)   NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count       int            NOT NULL DEFAULT 0,
  is_certified       boolean        NOT NULL DEFAULT false,
  suspended          boolean        NOT NULL DEFAULT false,
  documents_verified boolean        NOT NULL DEFAULT false,
  response_time_avg  int,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX garages_user_idx      ON public.garages(user_id);
CREATE INDEX garages_city_idx      ON public.garages(city);
CREATE INDEX garages_suspended_idx ON public.garages(suspended);
CREATE INDEX garages_geo_idx       ON public.garages(latitude, longitude);

-- =============================================================
-- 4. QUOTE_REQUESTS
-- =============================================================
CREATE TABLE public.quote_requests (
  id           uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
  conductor_id uuid            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garage_id    uuid            REFERENCES public.garages(id) ON DELETE SET NULL,
  vehicle_id   uuid            REFERENCES public.vehicles(id) ON DELETE SET NULL,
  service_type text            NOT NULL,
  description  text,
  images_urls  text[]          NOT NULL DEFAULT '{}',
  urgency      request_urgency NOT NULL DEFAULT 'medium',
  status       request_status  NOT NULL DEFAULT 'pending',
  created_at   timestamptz     NOT NULL DEFAULT now(),
  accepted_at  timestamptz,
  completed_at timestamptz
);
CREATE INDEX quote_requests_conductor_idx ON public.quote_requests(conductor_id);
CREATE INDEX quote_requests_garage_idx    ON public.quote_requests(garage_id);
CREATE INDEX quote_requests_status_idx   ON public.quote_requests(status);
CREATE INDEX quote_requests_vehicle_idx  ON public.quote_requests(vehicle_id);

-- =============================================================
-- 5. QUOTES
-- =============================================================
CREATE TABLE public.quotes (
  id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id       uuid         NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  garage_id        uuid         NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  diagnostic_price numeric(12,2) NOT NULL DEFAULT 0,
  parts_price      numeric(12,2) NOT NULL DEFAULT 0,
  labor_price      numeric(12,2) NOT NULL DEFAULT 0,
  total_price      numeric(12,2) NOT NULL DEFAULT 0,
  estimated_days   int,
  warranty         text,
  notes            text,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (request_id, garage_id),
  CONSTRAINT quotes_prices_non_negative
    CHECK (diagnostic_price >= 0 AND parts_price >= 0 AND labor_price >= 0 AND total_price >= 0)
);
CREATE INDEX quotes_request_idx ON public.quotes(request_id);
CREATE INDEX quotes_garage_idx  ON public.quotes(garage_id);

-- =============================================================
-- 6. MESSAGES
-- =============================================================
CREATE TABLE public.messages (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id   uuid        NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  sender_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      text,
  images_urls  text[]      NOT NULL DEFAULT '{}',
  read         boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_request_idx   ON public.messages(request_id);
CREATE INDEX messages_recipient_idx ON public.messages(recipient_id);
CREATE INDEX messages_sender_idx    ON public.messages(sender_id);

-- =============================================================
-- 7. REVIEWS  (un avis par demande, modéré avant publication)
-- =============================================================
CREATE TABLE public.reviews (
  id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id           uuid        NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  garage_id            uuid        NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  conductor_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating               int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quality_rating       int         CHECK (quality_rating BETWEEN 1 AND 5),
  transparency_rating  int         CHECK (transparency_rating BETWEEN 1 AND 5),
  timing_rating        int         CHECK (timing_rating BETWEEN 1 AND 5),
  communication_rating int         CHECK (communication_rating BETWEEN 1 AND 5),
  price_rating         int         CHECK (price_rating BETWEEN 1 AND 5),
  comment              text,
  approved             boolean     NOT NULL DEFAULT false,  -- attend validation admin
  flagged              boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id)
);
CREATE INDEX reviews_garage_idx    ON public.reviews(garage_id);
CREATE INDEX reviews_conductor_idx ON public.reviews(conductor_id);
CREATE INDEX reviews_flagged_idx   ON public.reviews(flagged);

-- =============================================================
-- 8. INVOICES  (immuables : pas de suppression hors admin)
-- =============================================================
CREATE TABLE public.invoices (
  id             uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id     uuid           NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  garage_id      uuid           NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  amount         numeric(12,2)  NOT NULL CHECK (amount > 0),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_date   timestamptz,
  created_at     timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX invoices_request_idx ON public.invoices(request_id);
CREATE INDEX invoices_garage_idx  ON public.invoices(garage_id);

-- =============================================================
-- 9. NOTIFICATIONS
-- =============================================================
CREATE TABLE public.notifications (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text,
  data       jsonb       NOT NULL DEFAULT '{}',
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id);

-- =============================================================
-- FONCTIONS & TRIGGERS
-- =============================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_garages_updated
  BEFORE UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Création automatique du profil à l'inscription (auth → public.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, phone, email, full_name, role, language)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'conductor'),
    COALESCE((NEW.raw_user_meta_data->>'language')::app_language, 'fr')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recalcul note / review_count garage après chaque avis
CREATE OR REPLACE FUNCTION public.recalc_garage_rating()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public AS $$
DECLARE
  gid uuid := COALESCE(NEW.garage_id, OLD.garage_id);
BEGIN
  UPDATE public.garages
  SET rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.reviews WHERE garage_id = gid AND approved = true
      ), 0),
      review_count = (
        SELECT COUNT(*) FROM public.reviews WHERE garage_id = gid AND approved = true
      )
  WHERE id = gid;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_reviews_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_garage_rating();

-- Passage de la demande en 'quoted' au premier devis reçu
CREATE OR REPLACE FUNCTION public.mark_request_quoted()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public AS $$
BEGIN
  UPDATE public.quote_requests
  SET status = 'quoted'
  WHERE id = NEW.request_id AND status = 'pending';
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_quote_marks_request
  AFTER INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.mark_request_quoted();

-- =============================================================
-- SCHÉMA PRIVÉ — helpers RLS hors API REST
-- (PostgREST n'expose pas le schéma private → non appelables en RPC)
-- =============================================================
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.owns_garage(g uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.garages WHERE id = g AND user_id = auth.uid());
$$;

-- Bloque l'escalade de rôle par les utilisateurs eux-mêmes
CREATE OR REPLACE FUNCTION private.prevent_role_escalation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT private.is_admin() THEN
    RAISE EXCEPTION 'Modification du rôle non autorisée';
  END IF;
  RETURN NEW;
END; $$;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin()                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.owns_garage(uuid)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.prevent_role_escalation() TO anon, authenticated;

CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION private.prevent_role_escalation();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- ---- users ----
-- Chaque utilisateur authentifié voit uniquement son propre profil complet.
-- La vue user_profiles expose les colonnes non sensibles à tous.
CREATE POLICY "users: son propre profil" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR private.is_admin());

CREATE POLICY "users: modifier le sien" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: admin tout" ON public.users
  FOR ALL USING (private.is_admin());

-- Vue safe sans données sensibles (email, phone) pour l'affichage cross-user
CREATE OR REPLACE VIEW public.user_profiles
  WITH (security_invoker = true) AS
  SELECT id, full_name, role, city, language, avatar_url, created_at, updated_at
  FROM public.users;
GRANT SELECT ON public.user_profiles TO authenticated, anon;

-- ---- vehicles ----
CREATE POLICY "vehicles: propriétaire" ON public.vehicles
  FOR ALL
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id);

-- ---- garages ----
CREATE POLICY "garages: visibles si actifs" ON public.garages
  FOR SELECT
  USING (suspended = false OR user_id = auth.uid() OR private.is_admin());

CREATE POLICY "garages: propriétaire gère" ON public.garages
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "garages: admin tout" ON public.garages
  FOR ALL USING (private.is_admin());

-- ---- quote_requests ----
CREATE POLICY "requests: conducteur ou garage concerné" ON public.quote_requests
  FOR SELECT
  USING (
    conductor_id = auth.uid()
    OR private.is_admin()
    OR private.owns_garage(garage_id)
    OR (garage_id IS NULL AND EXISTS (
      SELECT 1 FROM public.garages g WHERE g.user_id = auth.uid() AND g.suspended = false
    ))
  );

CREATE POLICY "requests: conducteur gère" ON public.quote_requests
  FOR ALL
  USING (conductor_id = auth.uid())
  WITH CHECK (conductor_id = auth.uid());

CREATE POLICY "requests: garage met à jour" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (private.owns_garage(garage_id))
  WITH CHECK (private.owns_garage(garage_id));

-- ---- quotes ----
CREATE POLICY "quotes: conducteur ou garage" ON public.quotes
  FOR SELECT
  USING (
    private.is_admin()
    OR private.owns_garage(garage_id)
    OR EXISTS (
      SELECT 1 FROM public.quote_requests r WHERE r.id = request_id AND r.conductor_id = auth.uid()
    )
  );

CREATE POLICY "quotes: garage gère" ON public.quotes
  FOR ALL
  USING (private.owns_garage(garage_id))
  WITH CHECK (private.owns_garage(garage_id));

-- ---- messages ----
CREATE POLICY "messages: expéditeur/destinataire" ON public.messages
  FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR private.is_admin());

CREATE POLICY "messages: envoi par l'expéditeur" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Le destinataire ne peut que marquer comme lu (WITH CHECK préserve recipient_id)
CREATE POLICY "messages: destinataire marque lu" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- ---- reviews ----
-- approved=false par défaut → admin doit approuver avant publication
CREATE POLICY "reviews: avis approuvés publics" ON public.reviews
  FOR SELECT
  USING (approved = true OR conductor_id = auth.uid() OR private.is_admin());

CREATE POLICY "reviews: conducteur écrit" ON public.reviews
  FOR ALL
  USING (conductor_id = auth.uid())
  WITH CHECK (conductor_id = auth.uid());

CREATE POLICY "reviews: admin modère" ON public.reviews
  FOR ALL USING (private.is_admin());

-- ---- invoices (audit trail immuable — pas de DELETE pour les garages) ----
CREATE POLICY "invoices: parties concernées" ON public.invoices
  FOR SELECT
  USING (
    private.is_admin()
    OR private.owns_garage(garage_id)
    OR EXISTS (
      SELECT 1 FROM public.quote_requests r WHERE r.id = request_id AND r.conductor_id = auth.uid()
    )
  );

CREATE POLICY "invoices: garage lit" ON public.invoices
  FOR SELECT TO authenticated
  USING (private.owns_garage(garage_id));

CREATE POLICY "invoices: garage crée" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (private.owns_garage(garage_id));

CREATE POLICY "invoices: garage modifie" ON public.invoices
  FOR UPDATE TO authenticated
  USING (private.owns_garage(garage_id))
  WITH CHECK (private.owns_garage(garage_id));

-- ---- notifications ----
CREATE POLICY "notifications: destinataire lit" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications: destinataire màj" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- REALTIME
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================================
-- STORAGE — 2 buckets : photos (public) + documents (privé)
-- =============================================================

-- Bucket photos : images non sensibles (avatars, demandes, chat, interventions)
-- Convention de chemins :
--   avatars/{user_id}/           → photo de profil
--   requests/{request_id}/       → photos de la demande
--   messages/{request_id}/       → pièces jointes chat
--   interventions/{request_id}/  → photos de fin d'intervention
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public            = true,
      file_size_limit   = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- Bucket documents : pièces sensibles de vérification (privé, jamais public)
-- Convention de chemins :
--   garages/{garage_id}/   → CNI, registre de commerce, etc.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = 10485760,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf'];

-- photos : upload dans les dossiers whitelistés, avatars confinés à son UID
CREATE POLICY "photos: upload authentifié" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = ANY (ARRAY['avatars','requests','messages','interventions'])
    AND ( (storage.foldername(name))[1] <> 'avatars'
          OR (storage.foldername(name))[2] = auth.uid()::text )
  );

-- photos : le propriétaire met à jour / supprime ses fichiers
CREATE POLICY "photos: maj propriétaire" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND owner = auth.uid());

CREATE POLICY "photos: suppression propriétaire" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND owner = auth.uid());

-- documents : garagiste propriétaire OU admin (lecture + écriture, jamais delete public)
CREATE POLICY "documents: garage propriétaire" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'garages'
    AND ( private.is_admin()
          OR private.owns_garage(NULLIF((storage.foldername(name))[2], '')::uuid) )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'garages'
    AND private.owns_garage(NULLIF((storage.foldername(name))[2], '')::uuid)
  );

-- =============================================================
-- FIN DU SCHÉMA
-- =============================================================
