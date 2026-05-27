-- =============================================================
-- Lot 6 - Interventions table creation
-- =============================================================
-- Objectif : Créer la table interventions pour tracker les étapes de travail
--            sur les demandes de devis (diagnostic, réparation, etc.)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.interventions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  intervention_type text NOT NULL
    CHECK (intervention_type IN ('diagnosis', 'repair', 'inspection', 'other')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'blocked')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_interventions_request_id
  ON public.interventions(request_id);
CREATE INDEX IF NOT EXISTS idx_interventions_garage_id
  ON public.interventions(garage_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status
  ON public.interventions(status);

-- Enable RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
