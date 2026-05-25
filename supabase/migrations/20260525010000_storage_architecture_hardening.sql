-- =============================================================
-- Lot 6 - Storage Architecture Hardening
-- =============================================================
-- Objectifs :
--   1. Créer 8 buckets séparés (pub-assets, avatars, photos, docs, etc.)
--   2. Implémenter 32 RLS policies (4 par bucket : SELECT, INSERT, UPDATE, DELETE)
--   3. Aligner les policies avec le modèle hiérarchique de propriété
--   4. Contrôler les tailles de fichier et visibilité publique
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) Bucket: public-assets (logos, branding) — PUBLIC, 10MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('public-assets', 'public-assets', true, 10485760, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: visible à tous (public)
DROP POLICY IF EXISTS "public-assets: select (public)" ON storage.objects;
CREATE POLICY "public-assets: select (public)"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-assets');

-- INSERT: admin seulement
DROP POLICY IF EXISTS "public-assets: insert (admin)" ON storage.objects;
CREATE POLICY "public-assets: insert (admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT private.is_admin())
  );

-- UPDATE: admin seulement
DROP POLICY IF EXISTS "public-assets: update (admin)" ON storage.objects;
CREATE POLICY "public-assets: update (admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'public-assets'
    AND (SELECT private.is_admin())
  )
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT private.is_admin())
  );

-- DELETE: admin seulement
DROP POLICY IF EXISTS "public-assets: delete (admin)" ON storage.objects;
CREATE POLICY "public-assets: delete (admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'public-assets'
    AND (SELECT private.is_admin())
  );

-- ─────────────────────────────────────────────────────────────
-- 2) Bucket: user-avatars (avatars profil) — PRIVATE, 5MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('user-avatars', 'user-avatars', false, 5242880, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: propriétaire ou admin
DROP POLICY IF EXISTS "user-avatars: select (owner/admin)" ON storage.objects;
CREATE POLICY "user-avatars: select (owner/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-avatars'
    AND (
      (storage.foldername(name))[1]::uuid = (SELECT auth.uid())
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: propriétaire ou admin
DROP POLICY IF EXISTS "user-avatars: insert (owner/admin)" ON storage.objects;
CREATE POLICY "user-avatars: insert (owner/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (
      (storage.foldername(name))[1]::uuid = (SELECT auth.uid())
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: propriétaire ou admin
DROP POLICY IF EXISTS "user-avatars: update (owner/admin)" ON storage.objects;
CREATE POLICY "user-avatars: update (owner/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND (
      (storage.foldername(name))[1]::uuid = (SELECT auth.uid())
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (
      (storage.foldername(name))[1]::uuid = (SELECT auth.uid())
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: propriétaire ou admin
DROP POLICY IF EXISTS "user-avatars: delete (owner/admin)" ON storage.objects;
CREATE POLICY "user-avatars: delete (owner/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND (
      (storage.foldername(name))[1]::uuid = (SELECT auth.uid())
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3) Bucket: garage-photos (photos garage) — SEMI-PUBLIC, 10MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('garage-photos', 'garage-photos', false, 10485760, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: visible si garage NOT suspended
DROP POLICY IF EXISTS "garage-photos: select (public non-suspendu)" ON storage.objects;
CREATE POLICY "garage-photos: select (public non-suspendu)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'garage-photos'
    AND NOT EXISTS (
      SELECT 1 FROM public.garages g
      WHERE g.id = (storage.foldername(name))[1]::uuid
      AND g.suspended = true
    )
  );

-- INSERT: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-photos: insert (owner/admin)" ON storage.objects;
CREATE POLICY "garage-photos: insert (owner/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'garage-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-photos: update (owner/admin)" ON storage.objects;
CREATE POLICY "garage-photos: update (owner/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'garage-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'garage-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-photos: delete (owner/admin)" ON storage.objects;
CREATE POLICY "garage-photos: delete (owner/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'garage-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4) Bucket: garage-documents (docs garage) — PRIVATE, 50MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('garage-documents', 'garage-documents', false, 52428800, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-documents: select (owner/admin)" ON storage.objects;
CREATE POLICY "garage-documents: select (owner/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'garage-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-documents: insert (owner/admin)" ON storage.objects;
CREATE POLICY "garage-documents: insert (owner/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'garage-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-documents: update (owner/admin)" ON storage.objects;
CREATE POLICY "garage-documents: update (owner/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'garage-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'garage-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: propriétaire garage ou admin
DROP POLICY IF EXISTS "garage-documents: delete (owner/admin)" ON storage.objects;
CREATE POLICY "garage-documents: delete (owner/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'garage-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = (storage.foldername(name))[1]::uuid
        AND g.user_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5) Bucket: quote-request-photos (photos demande) — PRIVATE, 20MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('quote-request-photos', 'quote-request-photos', false, 20971520, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: conducteur, garage assigné, ou admin
DROP POLICY IF EXISTS "quote-request-photos: select (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "quote-request-photos: select (conductor/garage/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'quote-request-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: conducteur ou garage assigné ou admin
DROP POLICY IF EXISTS "quote-request-photos: insert (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "quote-request-photos: insert (conductor/garage/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'quote-request-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: conducteur ou garage assigné ou admin
DROP POLICY IF EXISTS "quote-request-photos: update (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "quote-request-photos: update (conductor/garage/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'quote-request-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'quote-request-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: conducteur ou garage assigné ou admin
DROP POLICY IF EXISTS "quote-request-photos: delete (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "quote-request-photos: delete (conductor/garage/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'quote-request-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.quote_requests qr
        WHERE qr.id = (storage.foldername(name))[1]::uuid
        AND qr.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6) Bucket: quote-message-attachments (PJ messages) — PRIVATE, 15MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('quote-message-attachments', 'quote-message-attachments', false, 15728640, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: auteur ou destinataire du message ou admin
DROP POLICY IF EXISTS "quote-message-attachments: select (participants/admin)" ON storage.objects;
CREATE POLICY "quote-message-attachments: select (participants/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'quote-message-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = (storage.foldername(name))[1]::uuid
        AND (m.sender_id = (SELECT auth.uid()) OR m.recipient_id = (SELECT auth.uid()))
      )
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: auteur du message ou admin
DROP POLICY IF EXISTS "quote-message-attachments: insert (sender/admin)" ON storage.objects;
CREATE POLICY "quote-message-attachments: insert (sender/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'quote-message-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = (storage.foldername(name))[1]::uuid
        AND m.sender_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: auteur du message ou admin
DROP POLICY IF EXISTS "quote-message-attachments: update (sender/admin)" ON storage.objects;
CREATE POLICY "quote-message-attachments: update (sender/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'quote-message-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = (storage.foldername(name))[1]::uuid
        AND m.sender_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'quote-message-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = (storage.foldername(name))[1]::uuid
        AND m.sender_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: auteur du message ou admin
DROP POLICY IF EXISTS "quote-message-attachments: delete (sender/admin)" ON storage.objects;
CREATE POLICY "quote-message-attachments: delete (sender/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'quote-message-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = (storage.foldername(name))[1]::uuid
        AND m.sender_id = (SELECT auth.uid())
      )
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7) Bucket: intervention-before-after (photos avant/après) — PRIVATE, 20MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('intervention-before-after', 'intervention-before-after', false, 20971520, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: conducteur, garage, ou admin
DROP POLICY IF EXISTS "intervention-before-after: select (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "intervention-before-after: select (conductor/garage/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'intervention-before-after'
    AND (
      EXISTS (
        SELECT 1 FROM public.interventions i
        JOIN public.quote_requests qr ON i.request_id = qr.id
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.interventions i
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND i.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: garage ou admin
DROP POLICY IF EXISTS "intervention-before-after: insert (garage/admin)" ON storage.objects;
CREATE POLICY "intervention-before-after: insert (garage/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'intervention-before-after'
    AND (
      EXISTS (
        SELECT 1 FROM public.interventions i
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND i.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: garage ou admin
DROP POLICY IF EXISTS "intervention-before-after: update (garage/admin)" ON storage.objects;
CREATE POLICY "intervention-before-after: update (garage/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'intervention-before-after'
    AND (
      EXISTS (
        SELECT 1 FROM public.interventions i
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND i.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'intervention-before-after'
    AND (
      EXISTS (
        SELECT 1 FROM public.interventions i
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND i.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: garage ou admin
DROP POLICY IF EXISTS "intervention-before-after: delete (garage/admin)" ON storage.objects;
CREATE POLICY "intervention-before-after: delete (garage/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'intervention-before-after'
    AND (
      EXISTS (
        SELECT 1 FROM public.interventions i
        WHERE i.id = (storage.foldername(name))[1]::uuid
        AND i.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 8) Bucket: invoices (factures) — PRIVATE, 50MB max
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at, updated_at)
  VALUES ('invoices', 'invoices', false, 52428800, now(), now())
  ON CONFLICT (id) DO NOTHING;

-- SELECT: conducteur, garage, ou admin
DROP POLICY IF EXISTS "invoices: select (conductor/garage/admin)" ON storage.objects;
CREATE POLICY "invoices: select (conductor/garage/admin)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT 1 FROM public.invoices inv
        JOIN public.quote_requests qr ON inv.request_id = qr.id
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND qr.conductor_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.invoices inv
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND inv.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- INSERT: garage ou admin
DROP POLICY IF EXISTS "invoices: insert (garage/admin)" ON storage.objects;
CREATE POLICY "invoices: insert (garage/admin)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT 1 FROM public.invoices inv
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND inv.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- UPDATE: garage ou admin
DROP POLICY IF EXISTS "invoices: update (garage/admin)" ON storage.objects;
CREATE POLICY "invoices: update (garage/admin)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT 1 FROM public.invoices inv
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND inv.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT 1 FROM public.invoices inv
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND inv.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );

-- DELETE: garage ou admin
DROP POLICY IF EXISTS "invoices: delete (garage/admin)" ON storage.objects;
CREATE POLICY "invoices: delete (garage/admin)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT 1 FROM public.invoices inv
        WHERE inv.id = (storage.foldername(name))[1]::uuid
        AND inv.garage_id = (
          SELECT g.id FROM public.garages g
          WHERE g.user_id = (SELECT auth.uid())
        )
      )
      OR (SELECT private.is_admin())
    )
  );
