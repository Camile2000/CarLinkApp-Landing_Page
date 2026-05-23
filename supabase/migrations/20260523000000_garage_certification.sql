-- =============================================================
-- CarLink — Certification garagiste
-- Tables : garage_documents, garage_certification_audit
-- Migration : 2026-05-23
-- =============================================================

-- =============================================================
-- ENUMs
-- =============================================================
CREATE TYPE document_type AS ENUM (
  'id_card',
  'business_registry',
  'tax_certificate',
  'garage_photo',
  'other'
);

CREATE TYPE document_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE certification_action AS ENUM (
  'submitted',
  'approved',
  'rejected',
  'revoked'
);

-- =============================================================
-- garage_documents
-- 1 ligne = 1 fichier uploadé dans le bucket "documents"
-- Chemin bucket : documents/garages/{garage_id}/{doc_type}/{filename}
-- =============================================================
CREATE TABLE public.garage_documents (
  id            uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id     uuid            NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  uploaded_by   uuid            NOT NULL REFERENCES public.users(id),
  doc_type      document_type   NOT NULL,
  file_path     text            NOT NULL,        -- chemin relatif dans bucket documents
  status        document_status NOT NULL DEFAULT 'pending',
  reject_reason text,
  reviewed_by   uuid            REFERENCES public.users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz     NOT NULL DEFAULT now(),

  -- Un garage ne peut avoir qu'un seul doc approuvé par type
  CONSTRAINT garage_documents_unique_approved
    EXCLUDE USING btree (garage_id WITH =, doc_type WITH =)
    WHERE (status = 'approved')
);

CREATE INDEX garage_documents_garage_idx ON public.garage_documents(garage_id);
CREATE INDEX garage_documents_status_idx ON public.garage_documents(status);
CREATE INDEX garage_documents_type_idx   ON public.garage_documents(doc_type);

-- =============================================================
-- garage_certification_audit
-- Historique immuable : chaque action de certification/refus/révocation
-- Pas de UPDATE/DELETE → audit trail permanent
-- =============================================================
CREATE TABLE public.garage_certification_audit (
  id           uuid                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id    uuid                 NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  action       certification_action NOT NULL,
  reason       text,
  performed_by uuid                 REFERENCES public.users(id),
  created_at   timestamptz          NOT NULL DEFAULT now()
);

CREATE INDEX garage_cert_audit_garage_idx  ON public.garage_certification_audit(garage_id);
CREATE INDEX garage_cert_audit_action_idx  ON public.garage_certification_audit(action);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.garage_documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_certification_audit ENABLE ROW LEVEL SECURITY;

-- ── garage_documents ──────────────────────────────────────────

-- Propriétaire du garage lit ses documents ; admin lit tout
CREATE POLICY "garage_docs: propriétaire lit" ON public.garage_documents
  FOR SELECT TO authenticated
  USING (private.owns_garage(garage_id) OR private.is_admin());

-- Propriétaire upload : status forcé 'pending', reviewed_by NULL
-- → impossible de s'auto-approuver via l'API
CREATE POLICY "garage_docs: propriétaire upload" ON public.garage_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    private.owns_garage(garage_id)
    AND uploaded_by = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- Admin modère (met à jour status, reject_reason, reviewed_by, reviewed_at)
CREATE POLICY "garage_docs: admin modère" ON public.garage_documents
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Pas de DELETE policy pour les garages → documents conservés pour audit

-- ── garage_certification_audit ────────────────────────────────

-- Lecture : propriétaire voit son historique de certification + admin
CREATE POLICY "cert_audit: lecture" ON public.garage_certification_audit
  FOR SELECT TO authenticated
  USING (private.owns_garage(garage_id) OR private.is_admin());

-- Écriture : admin uniquement (déclenché par l'UI d'admin)
CREATE POLICY "cert_audit: écriture admin" ON public.garage_certification_audit
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());

-- Pas d'UPDATE / DELETE policy → audit trail immuable

-- =============================================================
-- GRANTS
-- (aligned avec policies RLS : authenticated fait INSERT/SELECT,
--  admin fait UPDATE sur garage_documents via policy)
-- =============================================================
GRANT SELECT, INSERT         ON public.garage_documents           TO authenticated;
GRANT UPDATE                 ON public.garage_documents           TO authenticated;
GRANT SELECT, INSERT         ON public.garage_certification_audit TO authenticated;

-- =============================================================
-- FIN DE MIGRATION
-- =============================================================
